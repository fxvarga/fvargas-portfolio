import Foundation
import WebKit
import UIKit

/// Handles JS → Swift export/share messages.
class ExportBridge: NSObject, WKScriptMessageHandler {
  static let handlerName = "export"

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

    Task { @MainActor in
      do {
        switch action {
        case "shareFile":
          try await handleShareFile(payload: payload, webView: webView)
          webView?.evaluateJavaScript("window.__nativeCallback('\(id)', null, true)")

        default:
          let escaped = "Unknown export action: \(action)"
          webView?.evaluateJavaScript("window.__nativeCallback('\(id)', '\(escaped)', null)")
        }
      } catch {
        let escaped = error.localizedDescription.replacingOccurrences(of: "'", with: "\\'")
        webView?.evaluateJavaScript("window.__nativeCallback('\(id)', '\(escaped)', null)")
      }
    }
  }

  @MainActor
  private func handleShareFile(payload: [String: Any], webView: WKWebView?) async throws {
    guard let filename = payload["filename"] as? String,
          let base64Data = payload["base64Data"] as? String,
          let data = Data(base64Encoded: base64Data) else {
      throw ExportError.invalidPayload
    }

    let mimeType = payload["mimeType"] as? String ?? "application/octet-stream"

    // Write to temp file
    let tempDir = FileManager.default.temporaryDirectory
    let fileURL = tempDir.appendingPathComponent(filename)
    try data.write(to: fileURL)

    // Present share sheet
    guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
          let rootVC = scene.windows.first?.rootViewController else {
      throw ExportError.noViewController
    }

    let activityVC = UIActivityViewController(
      activityItems: [fileURL],
      applicationActivities: nil
    )

    // iPad popover
    if let popover = activityVC.popoverPresentationController {
      popover.sourceView = webView
      popover.sourceRect = CGRect(x: UIScreen.main.bounds.midX, y: UIScreen.main.bounds.midY, width: 0, height: 0)
    }

    rootVC.present(activityVC, animated: true)
  }
}

enum ExportError: LocalizedError {
  case invalidPayload
  case noViewController

  var errorDescription: String? {
    switch self {
    case .invalidPayload: return "Invalid file export payload"
    case .noViewController: return "No view controller available for share sheet"
    }
  }
}
