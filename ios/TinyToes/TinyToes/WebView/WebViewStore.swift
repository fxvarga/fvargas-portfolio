import Foundation
import WebKit

/// Central store managing the WKWebView instance and its configuration.
class WebViewStore: ObservableObject {
  let webView: WKWebView

  private let storageBridge = StorageBridge()
  private let exportBridge = ExportBridge()

  init() {
    let config = WKWebViewConfiguration()
    config.preferences.javaScriptCanOpenWindowsAutomatically = false

    // Allow inline media playback (no fullscreen requirement)
    config.allowsInlineMediaPlayback = true
    config.mediaTypesRequiringUserActionForPlayback = []

    // Register JS → Swift message handlers
    let userContent = config.userContentController
    userContent.add(storageBridge, name: StorageBridge.handlerName)
    userContent.add(exportBridge, name: ExportBridge.handlerName)

    // Inject the native bridge JS shim before any page scripts run
    let bridgeScript = WKUserScript(
      source: Self.bridgeJavaScript,
      injectionTime: .atDocumentStart,
      forMainFrameOnly: true
    )
    userContent.addUserScript(bridgeScript)

    let webView = WKWebView(frame: .zero, configuration: config)
    #if DEBUG
    if #available(iOS 16.4, *) {
      webView.isInspectable = true
    }
    #endif
    self.webView = webView
  }

  /// Load the bundled web app, falling back to remote URL.
  func loadApp() {
    if let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
      webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
    } else {
      // Fallback to remote
      let remoteURL = URL(string: "https://tinytoes.fvargas.com")!
      webView.load(URLRequest(url: remoteURL))
    }
  }

  // MARK: - Bridge JavaScript

  /// JS shim injected at document start. Sets `window.__TINYTOES_NATIVE = true`
  /// and provides `window.nativeStorage` and `window.nativeExport` APIs.
  private static let bridgeJavaScript = """
  (function() {
    window.__TINYTOES_NATIVE = true;

    // Pending promise callbacks keyed by request ID
    const _pending = {};
    let _nextId = 1;

    function callNative(handler, action, payload) {
      return new Promise((resolve, reject) => {
        const id = String(_nextId++);
        _pending[id] = { resolve, reject };
        window.webkit.messageHandlers[handler].postMessage({
          id: id,
          action: action,
          payload: payload || {}
        });
      });
    }

    // Called from Swift to resolve/reject pending promises
    window.__nativeCallback = function(id, error, result) {
      const p = _pending[id];
      if (!p) return;
      delete _pending[id];
      if (error) {
        p.reject(new Error(error));
      } else {
        p.resolve(result);
      }
    };

    window.nativeStorage = {
      get: (store, key) => callNative('storage', 'get', { store, key }),
      getAll: (store) => callNative('storage', 'getAll', { store }),
      put: (store, key, value) => callNative('storage', 'put', { store, key, value }),
      delete: (store, key) => callNative('storage', 'delete', { store, key }),
      clear: (store) => callNative('storage', 'clear', { store }),
    };

    window.nativeExport = {
      shareFile: (filename, base64Data, mimeType) =>
        callNative('export', 'shareFile', { filename, base64Data, mimeType }),
    };
  })();
  """
}
