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
    webView.scrollView.bounces = false
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

    /// Consumes a persisted native crash report (from a previous run) and forwards it
    /// to the WebView telemetry bridge as a `native_crash_captured` error event.
    private func reportPendingCrashIfNeeded(_ webView: WKWebView) {
      guard let report = CrashReporter.shared.consumePendingReport() else { return }

      var properties: [String: Any] = [
        "crash_type": report["type"] as? String ?? "unknown",
        "crash_name": report["name"] as? String ?? "unknown",
        "crash_reason": report["reason"] as? String ?? "",
        "app_version": report["appVersion"] as? String ?? "unknown",
        "build_number": report["buildNumber"] as? String ?? "unknown",
        "crashed_at": report["timestamp"] as? String ?? ""
      ]
      if let signalName = report["signalName"] as? String {
        properties["crash_signal"] = signalName
      }
      if let breadcrumbs = report["breadcrumbs"] as? [String] {
        properties["breadcrumbs"] = breadcrumbs.joined(separator: " | ")
      }
      if let callStack = report["callStack"] as? [String] {
        properties["call_stack"] = callStack.prefix(20).joined(separator: "\n")
      }

      log("RECOVERED NATIVE CRASH: \(properties["crash_name"] ?? "") — \(properties["crash_reason"] ?? "")")

      let payload: [String: Any] = [
        "kind": "error",
        "name": "native_crash_captured",
        "properties": properties
      ]
      guard let data = try? JSONSerialization.data(withJSONObject: payload, options: []) else { return }
      let b64 = data.base64EncodedString()
      webView.evaluateJavaScript("window.__tinytoesNativeTelemetry && window.__tinytoesNativeTelemetry('\(b64)')")
    }


    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
      log("NAV START: \(webView.url?.absoluteString ?? "nil")")
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
      log("NAV COMMIT: \(webView.url?.absoluteString ?? "nil")")
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
      log("NAV FINISH: \(webView.url?.absoluteString ?? "nil")")

      // Forward any crash captured on the previous run into the telemetry pipeline.
      reportPendingCrashIfNeeded(webView)

      // Inject JS to capture errors and report page state
      let debugJS = """
      (function() {
        var info = {
          url: location.href,
          protocol: location.protocol,
          title: document.title,
          bodyChildren: document.body ? document.body.children.length : -1,
          bodyHTML: document.body ? document.body.innerHTML.substring(0, 500) : 'NO BODY',
          rootDiv: document.getElementById('root') ? document.getElementById('root').innerHTML.substring(0, 300) : 'NO #root',
          scripts: Array.from(document.querySelectorAll('script')).map(function(s) { return s.src || s.textContent.substring(0, 80); }),
          links: Array.from(document.querySelectorAll('link')).map(function(l) { return l.href; }),
          errors: window.__TT_ERRORS || []
        };
        return JSON.stringify(info);
      })();
      """
      webView.evaluateJavaScript(debugJS) { result, error in
        if let json = result as? String {
          self.log("PAGE STATE: \(json)")
        }
        if let error = error {
          self.log("JS EVAL ERROR: \(error.localizedDescription)")
        }
      }

      // Poll for errors after 2 seconds (React may fail async)
      DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
        let pollJS = """
        (function() {
          var root = document.getElementById('root');
          return JSON.stringify({
            rootChildren: root ? root.children.length : -1,
            rootHTML: root ? root.innerHTML.substring(0, 300) : 'NO ROOT',
            errors: window.__TT_ERRORS || [],
            allScripts: Array.from(document.querySelectorAll('script')).length,
            readyState: document.readyState
          });
        })();
        """
        webView.evaluateJavaScript(pollJS) { result, error in
          if let json = result as? String {
            self.log("POLL 2s: \(json)")
          }
        }
      }
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
