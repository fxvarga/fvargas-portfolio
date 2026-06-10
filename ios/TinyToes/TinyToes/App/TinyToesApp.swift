import SwiftUI

@main
struct TinyToesApp: App {
  @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

  var body: some Scene {
    WindowGroup {
      ContentView()
        .edgesIgnoringSafeArea(.all)
    }
  }
}
