import SwiftUI

struct ContentView: View {
  @StateObject private var webViewStore = WebViewStore()

  var body: some View {
    WebViewRepresentable(store: webViewStore)
      .edgesIgnoringSafeArea(.all)
      .onAppear {
        webViewStore.loadApp()
      }
  }
}
