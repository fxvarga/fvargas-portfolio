import SwiftUI
import WebKit

/// SwiftUI wrapper for the shared WKWebView instance.
struct WebViewRepresentable: UIViewRepresentable {
  @ObservedObject var store: WebViewStore
  @Binding var debugLog: [String]

  func makeUIView(context: Context) -> WKWebView {
    let webView = store.webView
    webView.navigationDelegate = context.coordinator
    webView.scrollView.contentInsetAdjustmentBehavior = .never
    webView.isOpaque = true
    webView.backgroundColor = .white
    context.coordinator.debugLog = $debugLog
    return webView
  }

  func updateUIView(_ uiView: WKWebView, context: Context) {}

  func makeCoordinator() -> Coordinator {
    Coordinator()
  }

  class Coordinator: NSObject, WKNavigationDelegate {
    var debugLog: Binding<[String]>?

    private func log(_ msg: String) {
      print("[TinyToes] \(msg)")
      DispatchQueue.main.async {
        self.debugLog?.wrappedValue.append(msg)
      }
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
      log("NAV START: \(webView.url?.absoluteString ?? "nil")")
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
      log("NAV COMMIT: \(webView.url?.absoluteString ?? "nil")")
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
      log("NAV FINISH: \(webView.url?.absoluteString ?? "nil")")

      // Inject JS to capture errors and report page state
      let debugJS = """
      (function() {
        var info = {
          url: location.href,
          protocol: location.protocol,
          title: document.title,
          bodyChildren: document.body ? document.body.children.length : -1,
          bodyHTML: document.body ? document.body.innerHTML.substring(0, 300) : 'NO BODY',
          rootDiv: document.getElementById('root') ? document.getElementById('root').innerHTML.substring(0, 200) : 'NO #root'
        };
        document.title = 'DBG:' + JSON.stringify(info);
      })();
      """
      webView.evaluateJavaScript(debugJS) { _, error in
        if let error = error {
          self.log("JS EVAL ERROR: \(error.localizedDescription)")
        }
      }

      // Read back the debug info from title
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        webView.evaluateJavaScript("document.title") { result, error in
          if let title = result as? String {
            self.log("PAGE STATE: \(title)")
          }
          if let error = error {
            self.log("TITLE READ ERROR: \(error.localizedDescription)")
          }
        }
      }

      // Also capture any JS errors
      let errorCatchJS = """
      window.onerror = function(msg, source, line, col, error) {
        document.title = 'JSERR:' + msg + ' at ' + source + ':' + line;
        return false;
      };
      window.addEventListener('unhandledrejection', function(e) {
        document.title = 'PROMISE_ERR:' + e.reason;
      });
      """
      webView.evaluateJavaScript(errorCatchJS, completionHandler: nil)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
      log("NAV FAILED: \(error.localizedDescription)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
      log("NAV PROVISIONAL FAILED: \(error.localizedDescription)")
      log("  URL was: \(webView.url?.absoluteString ?? "nil")")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
      let url = navigationAction.request.url?.absoluteString ?? "nil"
      log("NAV POLICY: \(url)")

      // Open external links in Safari
      if let reqURL = navigationAction.request.url,
         navigationAction.navigationType == .linkActivated,
         reqURL.host != nil,
         !reqURL.absoluteString.contains("tinytoes") {
        await UIApplication.shared.open(reqURL)
        return .cancel
      }
      return .allow
    }
  }
}
