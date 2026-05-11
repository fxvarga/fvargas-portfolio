import Foundation
import WebKit

/// Handles JS -> Swift storage messages and persists data as JSON files.
class StorageBridge: NSObject, WKScriptMessageHandler {
  static let handlerName = "storage"

  private let storage = NativeStorage()

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
        let result = try await handleAction(action, payload: payload)
        // Base64-encode the result to avoid any character escaping issues
        // with evaluateJavaScript string interpolation (e.g. large base64 photos)
        if let result = result, let data = result.data(using: .utf8) {
          let b64 = data.base64EncodedString()
          await MainActor.run {
            webView?.evaluateJavaScript("window.__nativeCallbackB64('\(id)', null, '\(b64)')")
          }
        } else {
          await MainActor.run {
            webView?.evaluateJavaScript("window.__nativeCallbackB64('\(id)', null, null)")
          }
        }
      } catch {
        let escaped = error.localizedDescription.replacingOccurrences(of: "'", with: "\\'")
        await MainActor.run {
          webView?.evaluateJavaScript("window.__nativeCallbackB64('\(id)', '\(escaped)', null)")
        }
      }
    }
  }

  private func handleAction(_ action: String, payload: [String: Any]) async throws -> String? {
    let store = payload["store"] as? String ?? "default"
    let key = payload["key"] as? String

    switch action {
    case "get":
      guard let key = key else { throw StorageError.missingKey }
      let value = try storage.get(store: store, key: key)
      return value

    case "getAll":
      let all = try storage.getAll(store: store)
      return all

    case "put":
      guard let key = key else { throw StorageError.missingKey }
      let value = payload["value"]
      let jsonData = try JSONSerialization.data(withJSONObject: value as Any)
      let jsonString = String(data: jsonData, encoding: .utf8) ?? "null"
      try storage.put(store: store, key: key, value: jsonString)
      return "true"

    case "delete":
      guard let key = key else { throw StorageError.missingKey }
      try storage.delete(store: store, key: key)
      return "true"

    case "clear":
      try storage.clear(store: store)
      return "true"

    default:
      throw StorageError.unknownAction(action)
    }
  }
}

enum StorageError: LocalizedError {
  case missingKey
  case unknownAction(String)

  var errorDescription: String? {
    switch self {
    case .missingKey: return "Missing key parameter"
    case .unknownAction(let a): return "Unknown storage action: \(a)"
    }
  }
}
