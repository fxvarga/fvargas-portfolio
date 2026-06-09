import Foundation
import WebKit

/// Central store managing the WKWebView instance and its configuration.
@MainActor
class WebViewStore: ObservableObject {
  let webView: WKWebView

  private let storageBridge = StorageBridge()
  private let exportBridge = ExportBridge()
  private let imageStore = NativeImageStore()
  private let schemeHandler: LocalSchemeHandler
  private let storeKitManager = StoreKitManager()
  private var iapBridge: IAPBridge?

  init() {
    self.schemeHandler = LocalSchemeHandler(imageStore: imageStore)
    let config = WKWebViewConfiguration()
    config.preferences.javaScriptCanOpenWindowsAutomatically = false

    // Use the default (persistent) data store so localStorage/cookies survive app restarts
    config.websiteDataStore = WKWebsiteDataStore.default()

    // Register custom URL scheme to serve local files with a proper origin
    config.setURLSchemeHandler(schemeHandler, forURLScheme: LocalSchemeHandler.scheme)

    // Allow inline media playback (no fullscreen requirement)
    config.allowsInlineMediaPlayback = true
    config.mediaTypesRequiringUserActionForPlayback = []

    // Register JS → Swift message handlers
    let userContent = config.userContentController
    userContent.add(storageBridge, name: StorageBridge.handlerName)
    userContent.add(exportBridge, name: ExportBridge.handlerName)
    userContent.add(ImageBridge(imageStore: imageStore), name: ImageBridge.handlerName)

    let iap = IAPBridge(storeKitManager: storeKitManager)
    userContent.add(iap, name: IAPBridge.handlerName)
    self.iapBridge = iap

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

  /// Load the app via custom scheme (app://localhost/).
  /// Falls back to remote URL if www/ is not in the bundle.
  func loadApp() {
    print("[TinyToes] loadApp() called")
    if Bundle.main.url(forResource: "www", withExtension: nil) != nil {
      let appURL = LocalSchemeHandler.baseURL
      print("[TinyToes] Loading via custom scheme: \(appURL)")
      webView.load(URLRequest(url: appURL))
    } else {
      print("[TinyToes] www/ NOT FOUND — falling back to remote")
      let remoteURL = URL(string: "https://tinytoes.fernando-vargas.com")!
      webView.load(URLRequest(url: remoteURL))
    }

    func handleIncomingShareURL(_ url: URL) {
      let escaped = url.absoluteString
        .replacingOccurrences(of: "\\", with: "\\\\")
        .replacingOccurrences(of: "'", with: "\\'")

      let js = """
      window.dispatchEvent(new CustomEvent('tinytoes-share-link', {
        detail: { url: '\(escaped)' }
      }));
      """

      webView.evaluateJavaScript(js)
    }
  }

  // MARK: - Bridge JavaScript

  /// JS shim injected at document start. Sets `window.__TINYTOES_NATIVE = true`
  /// and provides `window.nativeStorage` and `window.nativeExport` APIs.
  private static let bridgeJavaScript = """
  (function() {
    window.__TINYTOES_NATIVE = true;

    // Fix iOS viewport: override min-h-screen to use dynamic viewport height
    var style = document.createElement('style');
    style.textContent = '.min-h-screen { min-height: 100dvh !important; }';
    (document.head || document.documentElement).appendChild(style);

    // Early error capture — catches script load failures
    window.__TT_ERRORS = [];
    window.onerror = function(msg, source, line, col, error) {
      window.__TT_ERRORS.push('ERR: ' + msg + ' @ ' + source + ':' + line);
      return false;
    };
    window.addEventListener('unhandledrejection', function(e) {
      window.__TT_ERRORS.push('PROMISE: ' + String(e.reason));
    });

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

    // Base64-safe variant — decodes b64 JSON to avoid evaluateJavaScript
    // string interpolation issues with large payloads (e.g. photos)
    window.__nativeCallbackB64 = function(id, error, b64Result) {
      const p = _pending[id];
      if (!p) return;
      delete _pending[id];
      if (error) {
        p.reject(new Error(error));
      } else if (b64Result) {
        try {
          const json = atob(b64Result);
          p.resolve(JSON.parse(json));
        } catch (e) {
          p.reject(new Error('Failed to decode native response: ' + e.message));
        }
      } else {
        p.resolve(null);
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

    window.nativeImages = {
      save: (dataUrl) => callNative('images', 'save', { dataUrl }),
      read: (url) => callNative('images', 'read', { url }),
      delete: (url) => callNative('images', 'delete', { url }),
      clear: () => callNative('images', 'clear', {}),
    };

    window.nativeIAP = {
      purchase: () => callNative('iap', 'purchase', {}),
      restore: () => callNative('iap', 'restore', {}),
      getStatus: () => callNative('iap', 'getStatus', {}),
    };
  })();
  """
}
