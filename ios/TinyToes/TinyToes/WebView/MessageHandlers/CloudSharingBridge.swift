import CloudKit
import Foundation
import UIKit
import WebKit

class CloudSharingBridge: NSObject, WKScriptMessageHandler, UICloudSharingControllerDelegate {
  static let handlerName = "cloudSharing"

  private let container = CKContainer.default()
  private let zoneName = "TinyToesSharing"
  private let packageRecordType = "TinyToesSharePackage"
  private let assetRecordType = "TinyToesShareAsset"
  private let manifestField = "manifestJson"
  private let createdAtField = "createdAt"
  private let assetIdField = "assetId"
  private let fileField = "file"
  private let fileNameField = "fileName"
  private let contentTypeField = "contentType"
  private let packageRefField = "packageRef"

  func userContentController(
    _ userContentController: WKUserContentController,
    didReceive message: WKScriptMessage
  ) {
    guard let body = message.body as? [String: Any],
          let id = body["id"] as? String,
          let action = body["action"] as? String,
          let payload = body["payload"] as? [String: Any] else {
      return
    }

    let webView = message.webView

    Task {
      do {
        let result = try await handleAction(action, payload: payload, webView: webView)
        let data = try JSONSerialization.data(withJSONObject: result as Any, options: [.fragmentsAllowed])
        let b64 = data.base64EncodedString()
        await MainActor.run {
          webView?.evaluateJavaScript("window.__nativeCallbackB64('\(id)', null, '\(b64)')")
        }
      } catch {
        let escaped = error.localizedDescription.replacingOccurrences(of: "'", with: "\\'")
        await MainActor.run {
          webView?.evaluateJavaScript("window.__nativeCallbackB64('\(id)', '\(escaped)', null)")
        }
      }
    }
  }

  private func handleAction(_ action: String, payload: [String: Any], webView: WKWebView?) async throws -> Any {
    switch action {
    case "createSharePackage":
      return try await createSharePackage(payload: payload, webView: webView)
    case "importLatestSharedPackage":
      return try await importLatestSharedPackage() as Any
    default:
      throw CloudSharingBridgeError.unknownAction(action)
    }
  }

  private func createSharePackage(payload: [String: Any], webView: WKWebView?) async throws -> [String: Any] {
    guard let manifestJson = payload["manifestJson"] as? String,
          let assets = payload["assets"] as? [[String: Any]] else {
      throw CloudSharingBridgeError.invalidPayload
    }

    let zoneID = try await ensureShareZone()
    let root = CKRecord(recordType: packageRecordType, recordID: CKRecord.ID(recordName: UUID().uuidString, zoneID: zoneID))
    root[manifestField] = manifestJson as NSString
    root[createdAtField] = Date() as NSDate

    let share = CKShare(rootRecord: root)
    share[CKShare.SystemFieldKey.title] = "TinyToes memories" as NSString
    share.publicPermission = .none

    let rootRef = CKRecord.Reference(recordID: root.recordID, action: .deleteSelf)
    let assetRecords = try assets.map { try buildAssetRecord(from: $0, packageRef: rootRef, zoneID: zoneID) }

    try await save(records: [root, share] + assetRecords)
    try await presentShareController(share: share, webView: webView)

    return [
      "status": "presented",
      "recordName": root.recordID.recordName
    ]
  }

  private func importLatestSharedPackage() async throws -> [String: Any]? {
    guard let root = try await fetchLatestSharedRoot() else { return nil }
    let assetRecords = try await fetchAssets(for: root.recordID)

    return [
      "recordName": root.recordID.recordName,
      "manifestJson": root[manifestField] as? String ?? "{}",
      "assets": try assetRecords.map(assetPayload)
    ]
  }

  private func buildAssetRecord(from payload: [String: Any], packageRef: CKRecord.Reference, zoneID: CKRecordZone.ID) throws -> CKRecord {
    guard let assetId = payload["assetId"] as? String,
          let dataUrl = payload["dataUrl"] as? String,
          let data = dataFromDataUrl(dataUrl) else {
      throw CloudSharingBridgeError.invalidPayload
    }

    let fileName = (payload["fileName"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "\(assetId).jpg"
    let contentType = (payload["contentType"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "image/jpeg"
    let fileURL = try writeTempFile(data: data, fileName: fileName)

    let record = CKRecord(recordType: assetRecordType, recordID: CKRecord.ID(recordName: UUID().uuidString, zoneID: zoneID))
    record[assetIdField] = assetId as NSString
    record[fileNameField] = fileName as NSString
    record[contentTypeField] = contentType as NSString
    record[fileField] = CKAsset(fileURL: fileURL)
    record[packageRefField] = packageRef
    record.parent = packageRef
    return record
  }

  private func assetPayload(from record: CKRecord) throws -> [String: Any] {
    guard let assetId = record[assetIdField] as? String,
          let asset = record[fileField] as? CKAsset,
          let fileURL = asset.fileURL else {
      throw CloudSharingBridgeError.missingAsset
    }

    let data = try Data(contentsOf: fileURL)
    let contentType = (record[contentTypeField] as? String) ?? "image/jpeg"
    let fileName = (record[fileNameField] as? String) ?? "\(assetId).jpg"

    return [
      "assetId": assetId,
      "dataUrl": "data:\(contentType);base64,\(data.base64EncodedString())",
      "contentType": contentType,
      "fileName": fileName
    ]
  }

  private func save(records: [CKRecord]) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let operation = CKModifyRecordsOperation(recordsToSave: records, recordIDsToDelete: nil)
      operation.savePolicy = .allKeys
      operation.modifyRecordsResultBlock = { result in
        switch result {
        case .success:
          continuation.resume()
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
      container.privateCloudDatabase.add(operation)
    }
  }

  private func ensureShareZone() async throws -> CKRecordZone.ID {
    let zoneID = CKRecordZone.ID(zoneName: zoneName, ownerName: CKCurrentUserDefaultName)
    let zone = CKRecordZone(zoneID: zoneID)

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let operation = CKModifyRecordZonesOperation(recordZonesToSave: [zone], recordZoneIDsToDelete: nil)
      operation.modifyRecordZonesResultBlock = { result in
        switch result {
        case .success:
          continuation.resume()
        case .failure(let error):
          if let ckError = error as? CKError, ckError.code == .serverRecordChanged {
            continuation.resume()
          } else {
            continuation.resume(throwing: error)
          }
        }
      }
      container.privateCloudDatabase.add(operation)
    }

    return zoneID
  }

  private func fetchLatestSharedRoot() async throws -> CKRecord? {
    let query = CKQuery(recordType: packageRecordType, predicate: NSPredicate(value: true))
    query.sortDescriptors = [NSSortDescriptor(key: createdAtField, ascending: false)]

    let zones = try await fetchSharedZones()
    var latest: CKRecord?

    for zone in zones {
      let records = try await perform(query: query, in: zone.zoneID)
      if let first = records.first {
        let firstDate = (first[createdAtField] as? Date) ?? .distantPast
        let latestDate = (latest?[createdAtField] as? Date) ?? .distantPast
        if latest == nil || firstDate > latestDate {
          latest = first
        }
      }
    }

    return latest
  }

  private func fetchSharedZones() async throws -> [CKRecordZone] {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[CKRecordZone], Error>) in
      container.sharedCloudDatabase.fetchAllRecordZones { zones, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        continuation.resume(returning: zones ?? [])
      }
    }
  }

  private func fetchAssets(for packageRecordID: CKRecord.ID) async throws -> [CKRecord] {
    let ref = CKRecord.Reference(recordID: packageRecordID, action: .none)
    let query = CKQuery(recordType: assetRecordType, predicate: NSPredicate(format: "%K == %@", packageRefField, ref))

    return try await perform(query: query, in: packageRecordID.zoneID)
  }

  private func perform(query: CKQuery, in zoneID: CKRecordZone.ID) async throws -> [CKRecord] {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<[CKRecord], Error>) in
      container.sharedCloudDatabase.perform(query, inZoneWith: zoneID) { records, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }
        continuation.resume(returning: records ?? [])
      }
    }
  }

  @MainActor
  private func presentShareController(share: CKShare, webView: WKWebView?) async throws {
    guard let presenter = webView?.window?.rootViewController else {
      throw CloudSharingBridgeError.noPresenter
    }

    let controller = UICloudSharingController(share: share, container: container)
    controller.delegate = self
    controller.availablePermissions = [.allowReadOnly]
    presenter.present(controller, animated: true)
  }

  private func dataFromDataUrl(_ dataUrl: String) -> Data? {
    guard let comma = dataUrl.firstIndex(of: ",") else { return nil }
    return Data(base64Encoded: String(dataUrl[dataUrl.index(after: comma)...]))
  }

  private func writeTempFile(data: Data, fileName: String) throws -> URL {
    let safeName = fileName.replacingOccurrences(of: "/", with: "-")
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathComponent(safeName)
    try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    try data.write(to: url, options: .atomic)
    return url
  }

  func cloudSharingController(_ csc: UICloudSharingController, failedToSaveShareWithError error: Error) {
    print("[TinyToes] Cloud sharing failed: \(error.localizedDescription)")
  }

  func itemTitle(for csc: UICloudSharingController) -> String? {
    "TinyToes memories"
  }
}

enum CloudSharingBridgeError: LocalizedError {
  case invalidPayload
  case missingAsset
  case noPresenter
  case unknownAction(String)

  var errorDescription: String? {
    switch self {
    case .invalidPayload: return "Invalid CloudKit sharing payload."
    case .missingAsset: return "A shared CloudKit image is missing."
    case .noPresenter: return "TinyToes could not open the share sheet."
    case .unknownAction(let action): return "Unknown CloudKit sharing action: \(action)"
    }
  }
}
