import CloudKit
import UIKit

class AppDelegate: NSObject, UIApplicationDelegate {
  func application(
    _ application: UIApplication,
    userDidAcceptCloudKitShareWith cloudKitShareMetadata: CKShare.Metadata
  ) {
    let operation = CKAcceptSharesOperation(shareMetadatas: [cloudKitShareMetadata])
    operation.perShareResultBlock = { metadata, result in
      switch result {
      case .success:
        print("[TinyToes] Accepted CloudKit share: \(metadata.share.recordID.recordName)")
      case .failure(let error):
        print("[TinyToes] Failed to accept CloudKit share: \(error.localizedDescription)")
      }
    }
    operation.acceptSharesResultBlock = { result in
      if case .failure(let error) = result {
        print("[TinyToes] CloudKit share accept operation failed: \(error.localizedDescription)")
      }
    }
    CKContainer(identifier: cloudKitShareMetadata.containerIdentifier).add(operation)
  }
}
