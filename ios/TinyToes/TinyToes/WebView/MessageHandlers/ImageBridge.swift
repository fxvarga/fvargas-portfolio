import Foundation
import WebKit

class ImageBridge: NSObject, WKScriptMessageHandler {
  static let handlerName = "images"

  private let imageStore: NativeImageStore

  init(imageStore: NativeImageStore) {
    self.imageStore = imageStore
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

    Task {
      do {
        let result = try handleAction(action, payload: payload)
        let data = try JSONSerialization.data(withJSONObject: result, options: [.fragmentsAllowed])
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

  private func handleAction(_ action: String, payload: [String: Any]) throws -> Any {
    switch action {
    case "save":
      guard let dataUrl = payload["dataUrl"] as? String else { throw ImageBridgeError.missingValue }
      return try imageStore.save(dataUrl: dataUrl)
    case "read":
      guard let url = payload["url"] as? String else { throw ImageBridgeError.missingValue }
      return try imageStore.read(url: url)
    case "delete":
      guard let url = payload["url"] as? String else { throw ImageBridgeError.missingValue }
      try imageStore.delete(url: url)
      return true
    case "clear":
      try imageStore.clear()
      return true
    default:
      throw ImageBridgeError.unknownAction(action)
    }
  }
}

enum ImageBridgeError: LocalizedError {
  case missingValue
  case unknownAction(String)

  var errorDescription: String? {
    switch self {
    case .missingValue: return "Missing image value."
    case .unknownAction(let action): return "Unknown image action: \(action)"
    }
  }
}
