import Foundation

class NativeImageStore {
  static let routePrefix = "/__tinytoes_images/"

  private let baseDir: URL

  init() {
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    baseDir = docs.appendingPathComponent("tinytoes-images", isDirectory: true)
  }

  func save(dataUrl: String) throws -> String {
    let parsed = try parseDataUrl(dataUrl)
    try ensureDir(baseDir)

    let id = UUID().uuidString
    let filename = "\(id).\(parsed.ext)"
    let fileURL = baseDir.appendingPathComponent(filename)
    try parsed.data.write(to: fileURL, options: [.atomic])
    return "app://localhost\(Self.routePrefix)\(filename)"
  }

  func read(url: String) throws -> String {
    let fileURL = try fileUrl(forAppUrl: url)
    let data = try Data(contentsOf: fileURL)
    let mime = mimeType(for: fileURL.pathExtension)
    return "data:\(mime);base64,\(data.base64EncodedString())"
  }

  func delete(url: String) throws {
    let fileURL = try fileUrl(forAppUrl: url)
    if FileManager.default.fileExists(atPath: fileURL.path) {
      try FileManager.default.removeItem(at: fileURL)
    }
  }

  func clear() throws {
    if FileManager.default.fileExists(atPath: baseDir.path) {
      try FileManager.default.removeItem(at: baseDir)
    }
  }

  func fileUrl(forPath path: String) -> URL? {
    guard path.hasPrefix(Self.routePrefix) else { return nil }
    let filename = String(path.dropFirst(Self.routePrefix.count))
    guard !filename.isEmpty, !filename.contains("/") else { return nil }
    let fileURL = baseDir.appendingPathComponent(filename).standardizedFileURL
    guard fileURL.path.hasPrefix(baseDir.standardizedFileURL.path) else { return nil }
    return fileURL
  }

  func fileUrl(forAppUrl urlString: String) throws -> URL {
    guard let url = URL(string: urlString), let fileURL = fileUrl(forPath: url.path) else {
      throw NativeImageStoreError.invalidReference
    }
    return fileURL
  }

  private func ensureDir(_ url: URL) throws {
    if !FileManager.default.fileExists(atPath: url.path) {
      try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    }
  }

  private func parseDataUrl(_ dataUrl: String) throws -> (data: Data, ext: String) {
    guard dataUrl.starts(with: "data:image/"),
          let comma = dataUrl.firstIndex(of: ",") else {
      throw NativeImageStoreError.invalidDataUrl
    }

    let header = String(dataUrl[..<comma])
    let base64 = String(dataUrl[dataUrl.index(after: comma)...])
    guard let data = Data(base64Encoded: base64) else {
      throw NativeImageStoreError.invalidDataUrl
    }

    let ext: String
    if header.contains("image/png") {
      ext = "png"
    } else if header.contains("image/webp") {
      ext = "webp"
    } else if header.contains("image/gif") {
      ext = "gif"
    } else {
      ext = "jpg"
    }

    return (data, ext)
  }

  private func mimeType(for ext: String) -> String {
    switch ext.lowercased() {
    case "png": return "image/png"
    case "webp": return "image/webp"
    case "gif": return "image/gif"
    default: return "image/jpeg"
    }
  }
}

enum NativeImageStoreError: LocalizedError {
  case invalidDataUrl
  case invalidReference

  var errorDescription: String? {
    switch self {
    case .invalidDataUrl: return "Invalid image data."
    case .invalidReference: return "Invalid image reference."
    }
  }
}
