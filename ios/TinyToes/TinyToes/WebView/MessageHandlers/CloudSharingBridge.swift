import CloudKit
import Foundation
import UIKit
import WebKit

class CloudSharingBridge: NSObject, WKScriptMessageHandler, UICloudSharingControllerDelegate {
  static let handlerName = "cloudSharing"

  private let imageStore: NativeImageStore
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
  private weak var activeWebView: WKWebView?

  init(imageStore: NativeImageStore = NativeImageStore()) {
    self.imageStore = imageStore
    super.init()
  }

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
    CrashReporter.shared.leaveBreadcrumb("cloudSharing: received action=\(action)")
    emitTelemetry(webView: webView, name: "native_bridge_message_received", properties: [
      "handler": Self.handlerName,
      "action": action,
      "payload_bytes": approximatePayloadSize(payload)
    ])

    Task {
      do {
        let result = try await handleAction(action, payload: payload, webView: webView)
        emitTelemetry(webView: webView, name: "native_bridge_action_completed", properties: [
          "handler": Self.handlerName,
          "action": action
        ])
        let data = try JSONSerialization.data(withJSONObject: result as Any, options: [.fragmentsAllowed])
        let b64 = data.base64EncodedString()
        await MainActor.run {
          webView?.evaluateJavaScript("window.__nativeCallbackB64('\(id)', null, '\(b64)')")
        }
      } catch {
        emitTelemetry(webView: webView, kind: "error", name: "native_bridge_action_failed", properties: [
          "handler": Self.handlerName,
          "action": action,
          "error": error.localizedDescription
        ])
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
      return try await importLatestSharedPackage(webView: webView) as Any
    default:
      throw CloudSharingBridgeError.unknownAction(action)
    }
  }

  private func createSharePackage(payload: [String: Any], webView: WKWebView?) async throws -> [String: Any] {
    guard let manifestJson = payload["manifestJson"] as? String,
          let assets = payload["assets"] as? [[String: Any]] else {
      throw CloudSharingBridgeError.invalidPayload
    }

    emitTelemetry(webView: webView, name: "cloud_share_native_create_started", properties: [
      "asset_count": assets.count,
      "image_ref_count": assets.filter { ($0["imageRef"] as? String)?.isEmpty == false }.count,
      "data_url_count": assets.filter { ($0["dataUrl"] as? String)?.isEmpty == false }.count,
      "manifest_bytes": manifestJson.count,
      "payload_bytes": approximatePayloadSize(payload)
    ])

    let zoneID = try await ensureShareZone()
    emitTelemetry(webView: webView, name: "cloud_share_native_zone_ready", properties: ["zone": zoneID.zoneName])
    let root = CKRecord(recordType: packageRecordType, recordID: CKRecord.ID(recordName: UUID().uuidString, zoneID: zoneID))
    root[manifestField] = manifestJson as NSString
    root[createdAtField] = Date() as NSDate

    let share = CKShare(rootRecord: root)
    share[CKShare.SystemFieldKey.title] = "TinyToes memories" as NSString
    share.publicPermission = .none

    let rootRef = CKRecord.Reference(recordID: root.recordID, action: .deleteSelf)
    let assetRecords = try assets.map { try buildAssetRecord(from: $0, packageRef: rootRef, zoneID: zoneID) }
    emitTelemetry(webView: webView, name: "cloud_share_native_asset_records_built", properties: [
      "asset_count": assetRecords.count,
      "record_count": assetRecords.count + 2
    ])

    // The records (root + share + assets) are saved inside the controller's
    // preparationHandler so UIKit owns the save/share-link creation. Presenting an
    // already-saved CKShare via init(share:container:) leaves the local share.url nil,
    // which makes "Add People" fail with "a link couldn't be created for you to share".
    try await presentShareController(
      share: share,
      rootRecord: root,
      assetRecords: assetRecords,
      webView: webView
    )
    emitTelemetry(webView: webView, name: "cloud_share_native_sheet_presented", properties: [
      "record_name": root.recordID.recordName
    ])

    return [
      "status": "presented",
      "recordName": root.recordID.recordName
    ]
  }

  private func importLatestSharedPackage(webView: WKWebView?) async throws -> [String: Any]? {
    emitTelemetry(webView: webView, name: "cloud_share_native_import_started")
    guard let root = try await fetchLatestSharedRoot() else {
      emitTelemetry(webView: webView, name: "cloud_share_native_import_empty")
      return nil
    }
    let assetRecords = try await fetchAssets(for: root.recordID)

    emitTelemetry(webView: webView, name: "cloud_share_native_import_assets_fetched", properties: [
      "asset_count": assetRecords.count,
      "record_name": root.recordID.recordName
    ])

    return [
      "recordName": root.recordID.recordName,
      "manifestJson": root[manifestField] as? String ?? "{}",
      "assets": try assetRecords.map(assetPayload)
    ]
  }

  private func buildAssetRecord(from payload: [String: Any], packageRef: CKRecord.Reference, zoneID: CKRecordZone.ID) throws -> CKRecord {
    guard let assetId = payload["assetId"] as? String else {
      throw CloudSharingBridgeError.invalidPayload
    }

    let fileName = (payload["fileName"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "\(assetId).jpg"
    let contentType = (payload["contentType"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "image/jpeg"
    let fileURL = try assetFileURL(from: payload, fileName: fileName)
    print("[TinyToes] CloudKit asset \(assetId): \(fileName), source=\(payload["imageRef"] == nil ? "dataUrl" : "imageRef"), exists=\(FileManager.default.fileExists(atPath: fileURL.path))")

    let record = CKRecord(recordType: assetRecordType, recordID: CKRecord.ID(recordName: UUID().uuidString, zoneID: zoneID))
    record[assetIdField] = assetId as NSString
    record[fileNameField] = fileName as NSString
    record[contentTypeField] = contentType as NSString
    record[fileField] = CKAsset(fileURL: fileURL)
    record[packageRefField] = packageRef
    // CloudKit requires the share-hierarchy parent reference to use the .none action.
    // (The custom packageRef field above keeps .deleteSelf for cascade delete.)
    record.parent = CKRecord.Reference(recordID: packageRef.recordID, action: .none)
    return record
  }

  private func assetFileURL(from payload: [String: Any], fileName: String) throws -> URL {
    if let imageRef = payload["imageRef"] as? String, !imageRef.isEmpty {
      let fileURL = try imageStore.fileUrl(forAppUrl: imageRef)
      guard FileManager.default.fileExists(atPath: fileURL.path) else {
        throw CloudSharingBridgeError.missingAsset
      }
      return fileURL
    }

    if let dataUrl = payload["dataUrl"] as? String, let data = dataFromDataUrl(dataUrl) {
      print("[TinyToes] CloudKit dataUrl fallback asset: \(fileName), bytes=\(data.count)")
      return try writeTempFile(data: data, fileName: fileName)
    }

    throw CloudSharingBridgeError.invalidPayload
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

  /// Saves the records and returns the server-updated `CKShare` (which carries the
  /// minted share `.url`). Passing the un-refetched local share to the cloud-sharing
  /// controller leaves `.url` nil, so UIKit cannot create a link to add people.
  private func saveAndReturnShare(records: [CKRecord], localShare: CKShare) async throws -> CKShare {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<CKShare, Error>) in
      let operation = CKModifyRecordsOperation(recordsToSave: records, recordIDsToDelete: nil)
      operation.savePolicy = .allKeys
      var savedShare: CKShare?
      operation.perRecordSaveBlock = { _, result in
        if case .success(let record) = result, let share = record as? CKShare {
          savedShare = share
        }
      }
      operation.modifyRecordsResultBlock = { result in
        switch result {
        case .success:
          continuation.resume(returning: savedShare ?? localShare)
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
  private func presentShareController(
    share: CKShare,
    rootRecord: CKRecord,
    assetRecords: [CKRecord],
    webView: WKWebView?
  ) async throws {
    guard let presenter = webView?.window?.rootViewController else {
      throw CloudSharingBridgeError.noPresenter
    }
    activeWebView = webView

    let recordsToSave = [rootRecord, share] + assetRecords
    let assetCount = assetRecords.count
    let recordName = rootRecord.recordID.recordName

    // Use the preparationHandler initializer so UIKit performs the save and mints the
    // share URL itself. This is the Apple-recommended path for creating a brand-new
    // share and avoids the "a link couldn't be created for you to share" failure that
    // occurs when presenting a pre-saved share whose local .url is still nil.
    let controller = UICloudSharingController { [weak self] _, completion in
      guard let self else {
        completion(nil, nil, CloudSharingBridgeError.noPresenter)
        return
      }
      Task {
        do {
          let savedShare = try await self.saveAndReturnShare(records: recordsToSave, localShare: share)
          CrashReporter.shared.leaveBreadcrumb("cloudShare: records saved (\(assetCount) assets), share.url=\(savedShare.url != nil)")
          self.emitTelemetry(webView: webView, name: "cloud_share_native_records_saved", properties: [
            "asset_count": assetCount,
            "record_name": recordName,
            "has_share_url": savedShare.url != nil
          ])
          completion(savedShare, self.container, nil)
        } catch {
          let isQuota = (error as? CKError)?.code == .quotaExceeded
          let surfacedError: Error = isQuota ? CloudSharingBridgeError.quotaExceeded : error
          self.emitTelemetry(
            webView: webView,
            kind: "error",
            name: isQuota ? "cloud_share_native_quota_exceeded" : "cloud_share_native_save_failed",
            properties: ["error": error.localizedDescription]
          )
          completion(nil, nil, surfacedError)
        }
      }
    }
    controller.delegate = self
    // availablePermissions must include at least one privacy option (.allowPrivate/.allowPublic)
    // AND at least one action option (.allowReadOnly/.allowReadWrite). Specifying only an action
    // option (e.g. [.allowReadOnly]) makes UICloudSharingController throw and crash on present.
    controller.availablePermissions = [.allowPrivate, .allowReadOnly]
    CrashReporter.shared.leaveBreadcrumb("cloudShare: presenting UICloudSharingController (preparationHandler)")
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

  private func emitTelemetry(
    webView: WKWebView?,
    kind: String = "event",
    name: String,
    properties: [String: Any] = [:]
  ) {
    print("[TinyToes] \(name): \(properties)")
    guard let webView else { return }

    let payload: [String: Any] = [
      "kind": kind,
      "name": name,
      "properties": sanitizedTelemetryProperties(properties)
    ]

    guard let data = try? JSONSerialization.data(withJSONObject: payload, options: []) else { return }
    let b64 = data.base64EncodedString()
    Task { @MainActor in
      webView.evaluateJavaScript("window.__tinytoesNativeTelemetry && window.__tinytoesNativeTelemetry('\(b64)')")
    }
  }

  private func sanitizedTelemetryProperties(_ properties: [String: Any]) -> [String: Any] {
    var result: [String: Any] = [:]
    for (key, value) in properties {
      if let value = value as? String {
        result[key] = value
      } else if let value = value as? Int {
        result[key] = value
      } else if let value = value as? Bool {
        result[key] = value
      } else if let value = value as? Double {
        result[key] = value
      } else {
        result[key] = String(describing: value)
      }
    }
    return result
  }

  private func approximatePayloadSize(_ value: Any) -> Int {
    if let value = value as? String {
      return value.utf8.count
    }
    if let value = value as? [Any] {
      return value.reduce(2) { total, item in total + approximatePayloadSize(item) + 1 }
    }
    if let value = value as? [String: Any] {
      return value.reduce(2) { total, entry in total + entry.key.utf8.count + approximatePayloadSize(entry.value) + 4 }
    }
    return String(describing: value).utf8.count
  }

  func cloudSharingController(_ csc: UICloudSharingController, failedToSaveShareWithError error: Error) {
    print("[TinyToes] Cloud sharing failed: \(error.localizedDescription)")
    emitTelemetry(webView: activeWebView, kind: "error", name: "cloud_share_native_controller_save_failed", properties: [
      "error": error.localizedDescription
    ])
  }

  func cloudSharingControllerDidSaveShare(_ csc: UICloudSharingController) {
    emitTelemetry(webView: activeWebView, name: "cloud_share_native_controller_saved")
  }

  func cloudSharingControllerDidStopSharing(_ csc: UICloudSharingController) {
    emitTelemetry(webView: activeWebView, name: "cloud_share_native_controller_stopped")
  }

  func itemTitle(for csc: UICloudSharingController) -> String? {
    "TinyToes memories"
  }
}

enum CloudSharingBridgeError: LocalizedError {
  case invalidPayload
  case missingAsset
  case noPresenter
  case quotaExceeded
  case unknownAction(String)

  var errorDescription: String? {
    switch self {
    case .invalidPayload: return "Invalid CloudKit sharing payload."
    case .missingAsset: return "A shared CloudKit image is missing."
    case .noPresenter: return "TinyToes could not open the share sheet."
    case .quotaExceeded: return "Your iCloud storage is full. Free up space in Settings › iCloud, then try sharing again."
    case .unknownAction(let action): return "Unknown CloudKit sharing action: \(action)"
    }
  }
}
