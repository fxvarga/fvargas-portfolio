import Foundation
import WebKit

/// Serves files from the app bundle's www/ directory via a custom URL scheme.
/// This allows WKWebView to load local files with a proper origin (app://localhost/)
/// which is required for ES module scripts to execute.
class LocalSchemeHandler: NSObject, WKURLSchemeHandler {
  static let scheme = "app"
  static let host = "localhost"
  static let baseURL = URL(string: "\(scheme)://\(host)/")!

  private let wwwRoot: URL?

  override init() {
    self.wwwRoot = Bundle.main.url(forResource: "www", withExtension: nil)
    super.init()
    if let root = wwwRoot {
      print("[TinyToes] LocalSchemeHandler: www root = \(root.path)")
    } else {
      print("[TinyToes] LocalSchemeHandler: ERROR — www not found in bundle")
    }
  }

  func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
    guard let requestURL = urlSchemeTask.request.url else {
      urlSchemeTask.didFailWithError(NSError(domain: "LocalSchemeHandler", code: -1,
        userInfo: [NSLocalizedDescriptionKey: "No URL in request"]))
      return
    }

    // Map app://localhost/path → www/path
    var path = requestURL.path
    if path.isEmpty || path == "/" {
      path = "/index.html"
    }

    // Remove leading slash
    let relativePath = String(path.dropFirst())

    guard let wwwRoot = wwwRoot else {
      failWith404(urlSchemeTask, path: relativePath)
      return
    }

    let fileURL = wwwRoot.appendingPathComponent(relativePath)

    // Security: ensure the resolved path is within www/
    guard fileURL.standardizedFileURL.path.hasPrefix(wwwRoot.standardizedFileURL.path) else {
      failWith404(urlSchemeTask, path: relativePath)
      return
    }

    guard FileManager.default.fileExists(atPath: fileURL.path) else {
      // For SPA: serve index.html for non-file paths (hash router shouldn't need this, but just in case)
      if !relativePath.contains(".") {
        let indexURL = wwwRoot.appendingPathComponent("index.html")
        if FileManager.default.fileExists(atPath: indexURL.path) {
          serveFile(urlSchemeTask, fileURL: indexURL)
          return
        }
      }
      failWith404(urlSchemeTask, path: relativePath)
      return
    }

    serveFile(urlSchemeTask, fileURL: fileURL)
  }

  func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
    // Nothing to cancel
  }

  // MARK: - Private

  private func serveFile(_ task: WKURLSchemeTask, fileURL: URL) {
    guard let data = try? Data(contentsOf: fileURL) else {
      failWith404(task, path: fileURL.lastPathComponent)
      return
    }

    let mimeType = Self.mimeType(for: fileURL.pathExtension)
    let response = HTTPURLResponse(
      url: task.request.url!,
      statusCode: 200,
      httpVersion: "HTTP/1.1",
      headerFields: [
        "Content-Type": mimeType,
        "Content-Length": "\(data.count)",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      ]
    )!

    task.didReceive(response)
    task.didReceive(data)
    task.didFinish()
  }

  private func failWith404(_ task: WKURLSchemeTask, path: String) {
    print("[TinyToes] 404: \(path)")
    let response = HTTPURLResponse(
      url: task.request.url!,
      statusCode: 404,
      httpVersion: "HTTP/1.1",
      headerFields: ["Content-Type": "text/plain"]
    )!
    let body = "Not found: \(path)".data(using: .utf8)!
    task.didReceive(response)
    task.didReceive(body)
    task.didFinish()
  }

  private static func mimeType(for ext: String) -> String {
    switch ext.lowercased() {
    case "html": return "text/html; charset=utf-8"
    case "js":   return "application/javascript; charset=utf-8"
    case "mjs":  return "application/javascript; charset=utf-8"
    case "css":  return "text/css; charset=utf-8"
    case "json": return "application/json; charset=utf-8"
    case "png":  return "image/png"
    case "jpg", "jpeg": return "image/jpeg"
    case "gif":  return "image/gif"
    case "svg":  return "image/svg+xml"
    case "ico":  return "image/x-icon"
    case "woff": return "font/woff"
    case "woff2": return "font/woff2"
    case "ttf":  return "font/ttf"
    case "otf":  return "font/otf"
    case "webp": return "image/webp"
    case "webmanifest": return "application/manifest+json"
    default:     return "application/octet-stream"
    }
  }
}
