import Foundation
import WebKit

/// Message handler that bridges StoreKit purchases from JavaScript.
/// JS calls: window.nativeIAP.purchase() / restore() / getStatus()
class IAPBridge: NSObject, WKScriptMessageHandler {
    static let handlerName = "iap"

    private let storeKitManager: StoreKitManager

    init(storeKitManager: StoreKitManager) {
        self.storeKitManager = storeKitManager
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any],
              let id = body["id"] as? String,
              let action = body["action"] as? String else { return }

        let webView = message.webView

        Task { @MainActor in
            switch action {
            case "purchase":
                await storeKitManager.purchase()
                let txnId = storeKitManager.transactionId ?? ""
                let success = storeKitManager.isPurchased
                let error = storeKitManager.errorMessage
                if let err = error {
                    self.callback(webView: webView, id: id, error: err, result: nil)
                } else if success {
                    self.callback(webView: webView, id: id, error: nil,
                                  result: "{\"transactionId\":\"\(txnId)\",\"purchased\":true}")
                } else {
                    self.callback(webView: webView, id: id, error: nil,
                                  result: "{\"purchased\":false}")
                }

            case "restore":
                await storeKitManager.restore()
                let txnId = storeKitManager.transactionId ?? ""
                let success = storeKitManager.isPurchased
                let error = storeKitManager.errorMessage
                if let err = error {
                    self.callback(webView: webView, id: id, error: err, result: nil)
                } else {
                    self.callback(webView: webView, id: id, error: nil,
                                  result: "{\"transactionId\":\"\(txnId)\",\"purchased\":\(success)}")
                }

            case "getStatus":
                await storeKitManager.checkEntitlement()
                let txnId = storeKitManager.transactionId ?? ""
                let purchased = storeKitManager.isPurchased
                let price = storeKitManager.product?.displayPrice ?? ""
                self.callback(webView: webView, id: id, error: nil,
                              result: "{\"transactionId\":\"\(txnId)\",\"purchased\":\(purchased),\"price\":\"\(price)\"}")

            default:
                self.callback(webView: webView, id: id, error: "Unknown IAP action: \(action)", result: nil)
            }
        }
    }

    private func callback(webView: WKWebView?, id: String, error: String?, result: String?) {
        let errorArg = error.map { "'\($0.replacingOccurrences(of: "'", with: "\\'"))'" } ?? "null"
        let resultArg: String
        if let result {
            resultArg = result
        } else {
            resultArg = "null"
        }
        let js = "window.__nativeCallback('\(id)', \(errorArg), \(resultArg));"
        webView?.evaluateJavaScript(js)
    }
}
