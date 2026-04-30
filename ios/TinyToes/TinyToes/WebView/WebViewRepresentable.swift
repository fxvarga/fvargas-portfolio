import SwiftUI
import WebKit

/// SwiftUI wrapper for the shared WKWebView instance.
struct WebViewRepresentable: UIViewRepresentable {
  @ObservedObject var store: WebViewStore

  func makeUIView(context: Context) -> WKWebView {
    let webView = store.webView
    webView.navigationDelegate = context.coordinator
    webView.scrollView.contentInsetAdjustmentBehavior = .never
    webView.isOpaque = false
    webView.backgroundColor = .systemBackground
    return webView
  }

  func updateUIView(_ uiView: WKWebView, context: Context) {}

  func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  class Coordinator: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
      // Open external links in Safari
      if let url = navigationAction.request.url,
         navigationAction.navigationType == .linkActivated,
         url.host != nil,
         !url.absoluteString.contains("tinytoes") {
        await UIApplication.shared.open(url)
        return .cancel
      }
      return .allow
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
      print("[TinyToes] Navigation failed: \(error.localizedDescription)")
    }
  }
}
