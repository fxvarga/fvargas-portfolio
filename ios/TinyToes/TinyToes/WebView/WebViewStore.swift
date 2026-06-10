import Foundation
import WebKit

/// Central store managing the WKWebView instance and its configuration.
@MainActor
class WebViewStore: ObservableObject {
  let webView: WKWebView

  private let storageBridge = StorageBridge()
  private let exportBridge = ExportBridge()
  private let imageStore: NativeImageStore
  private let cloudSharingBridge: CloudSharingBridge
  private let schemeHandler: LocalSchemeHandler
  private let storeKitManager = StoreKitManager()
  private var iapBridge: IAPBridge?

  init() {
    let imageStore = NativeImageStore()
    self.imageStore = imageStore
    self.cloudSharingBridge = CloudSharingBridge(imageStore: imageStore)
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
    userContent.add(cloudSharingBridge, name: CloudSharingBridge.handlerName)
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
    window.__TT_NATIVE_TELEMETRY = window.__TT_NATIVE_TELEMETRY || [];
    function trackNativeBridgeEvent(kind, name, properties) {
      const item = { kind: kind || 'event', name: name, properties: properties || {} };
      if (window.__tinytoesAnalyticsTrack) {
        window.__tinytoesAnalyticsTrack(item.kind, item.name, item.properties);
      } else {
        window.__TT_NATIVE_TELEMETRY.push(item);
      }
    }
    function summarizeNativePayload(handler, action, payload) {
      const summary = { handler: handler, action: action };
      try {
        if (payload && typeof payload.manifestJson === 'string') summary.manifest_bytes = payload.manifestJson.length;
        if (payload && Array.isArray(payload.assets)) {
          summary.asset_count = payload.assets.length;
          summary.image_ref_count = payload.assets.filter(asset => !!asset.imageRef).length;
          summary.data_url_count = payload.assets.filter(asset => !!asset.dataUrl).length;
          summary.total_data_url_bytes = payload.assets.reduce((total, asset) => total + (asset.dataUrl ? asset.dataUrl.length : 0), 0);
        }
      } catch (e) {
        summary.summary_error = String(e);
      }
      return summary;
    }
    window.__tinytoesNativeTelemetry = function(b64) {
      try {
        const item = JSON.parse(atob(b64));
        trackNativeBridgeEvent(item.kind || 'event', item.name, item.properties || {});
      } catch (e) {
        window.__TT_ERRORS.push('NATIVE_TELEMETRY: ' + String(e));
      }
    };
    window.onerror = function(msg, source, line, col, error) {
      window.__TT_ERRORS.push('ERR: ' + msg + ' @ ' + source + ':' + line);
      trackNativeBridgeEvent('error', 'native_webview_window_error', {
        message: String(msg),
        source: String(source || 'unknown'),
        line: line || 0,
        column: col || 0
      });
      return false;
    };
    window.addEventListener('unhandledrejection', function(e) {
      window.__TT_ERRORS.push('PROMISE: ' + String(e.reason));
      trackNativeBridgeEvent('error', 'native_webview_unhandled_rejection', {
        reason: String(e.reason || 'unknown')
      });
    });

    // Pending promise callbacks keyed by request ID
    const _pending = {};
    let _nextId = 1;

    function callNative(handler, action, payload) {
      return new Promise((resolve, reject) => {
        const id = String(_nextId++);
        _pending[id] = { resolve, reject };
        const summary = summarizeNativePayload(handler, action, payload || {});
        trackNativeBridgeEvent('event', 'native_bridge_call_posting', summary);
        try {
          window.webkit.messageHandlers[handler].postMessage({
            id: id,
            action: action,
            payload: payload || {}
          });
        } catch (e) {
          delete _pending[id];
          trackNativeBridgeEvent('error', 'native_bridge_call_post_failed', { ...summary, error: String(e) });
          reject(e);
        }
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

    window.nativeCloudSharing = {
      createSharePackage: (manifestJson, assets) =>
        callNative('cloudSharing', 'createSharePackage', { manifestJson, assets }),
      importLatestSharedPackage: () =>
        callNative('cloudSharing', 'importLatestSharedPackage', {}),
    };

    window.nativeIAP = {
      purchase: () => callNative('iap', 'purchase', {}),
      restore: () => callNative('iap', 'restore', {}),
      getStatus: () => callNative('iap', 'getStatus', {}),
    };
  })();
  """
}
