import SwiftUI

struct ContentView: View {
  @StateObject private var webViewStore = WebViewStore()
  @State private var debugLog: [String] = ["App launched"]
  @State private var showDebug = true

  var body: some View {
    ZStack {
      Color.white.edgesIgnoringSafeArea(.all)

      WebViewRepresentable(store: webViewStore, debugLog: $debugLog)
        .edgesIgnoringSafeArea(.all)

      // DEBUG OVERLAY — big visible panel
      if showDebug {
        VStack(alignment: .leading, spacing: 4) {
          HStack {
            Text("DEBUG")
              .font(.system(size: 16, weight: .bold, design: .monospaced))
              .foregroundColor(.white)
            Spacer()
            Button("X") { showDebug = false }
              .foregroundColor(.yellow)
              .font(.system(size: 16, weight: .bold))
          }

          ScrollView {
            VStack(alignment: .leading, spacing: 2) {
              ForEach(Array(debugLog.enumerated()), id: \.offset) { _, line in
                Text(line)
                  .font(.system(size: 11, design: .monospaced))
                  .foregroundColor(.green)
                  .fixedSize(horizontal: false, vertical: true)
              }
            }
          }
        }
        .padding(10)
        .frame(maxWidth: .infinity, maxHeight: 350)
        .background(Color.black.opacity(0.9))
        .cornerRadius(12)
        .padding(.horizontal, 10)
        .padding(.top, 60)
        .frame(maxHeight: .infinity, alignment: .top)
      }

      // Tap to bring debug back
      if !showDebug {
        VStack {
          HStack {
            Spacer()
            Button("DBG") { showDebug = true }
              .font(.system(size: 12, weight: .bold))
              .foregroundColor(.black)
              .padding(6)
              .background(Color.yellow)
              .cornerRadius(6)
              .padding(8)
          }
          Spacer()
        }
        .padding(.top, 50)
      }
    }
    .onAppear {
      debugLog.append("onAppear fired")

      // Check bundle contents
      if let wwwURL = Bundle.main.url(forResource: "www", withExtension: nil) {
        debugLog.append("www dir: \(wwwURL.path)")
        if let files = try? FileManager.default.contentsOfDirectory(atPath: wwwURL.path) {
          debugLog.append("www files (\(files.count)): \(files.joined(separator: ", "))")
        } else {
          debugLog.append("ERROR: cannot list www dir")
        }

        // Check assets subdirectory
        let assetsPath = wwwURL.path + "/assets"
        if let assetFiles = try? FileManager.default.contentsOfDirectory(atPath: assetsPath) {
          debugLog.append("assets/ (\(assetFiles.count)): \(assetFiles.joined(separator: ", "))")
        } else {
          debugLog.append("ERROR: www/assets/ NOT FOUND")
        }

        // Check icons subdirectory
        let iconsPath = wwwURL.path + "/icons"
        if let iconFiles = try? FileManager.default.contentsOfDirectory(atPath: iconsPath) {
          debugLog.append("icons/ (\(iconFiles.count)): \(iconFiles.joined(separator: ", "))")
        } else {
          debugLog.append("icons/ not found (ok)")
        }
      } else {
        debugLog.append("ERROR: www dir NOT FOUND in bundle")
      }

      if let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
        debugLog.append("index.html FOUND: \(indexURL.path)")
        if let html = try? String(contentsOf: indexURL, encoding: .utf8) {
          debugLog.append("HTML length: \(html.count)")
          // Show the full HTML so we can see script/link src paths
          let lines = html.components(separatedBy: "\n")
          for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.contains("script") || trimmed.contains("link") || trimmed.contains("src=") || trimmed.contains("href=") {
              debugLog.append("  \(trimmed)")
            }
          }
        }
      } else {
        debugLog.append("ERROR: index.html NOT FOUND in www/")
        // List all bundle resources
        if let resourcePath = Bundle.main.resourcePath {
          let allFiles = (try? FileManager.default.contentsOfDirectory(atPath: resourcePath)) ?? []
          debugLog.append("Bundle root (\(allFiles.count)): \(allFiles.joined(separator: ", "))")
        }
      }

      debugLog.append("Loading via app:// scheme")
      webViewStore.loadApp()
    }
  }
}
