import SwiftUI

struct ContentView: View {
  @StateObject private var webViewStore = WebViewStore()

  var body: some View {
    WebViewRepresentable(store: webViewStore, debugLog: .constant([]))
      .edgesIgnoringSafeArea(.all)
      .onAppear {
        webViewStore.loadApp()
      }
      .onOpenURL { url in
        webViewStore.handleIncomingShareURL(url)
      }
  }
}
