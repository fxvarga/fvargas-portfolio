import Foundation

/// File-based JSON persistence. Each store is a directory under Documents/tinytoes-data/,
/// and each key is a JSON file within that directory.
class NativeStorage {
  private let baseDir: URL

  init() {
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
    baseDir = docs.appendingPathComponent("tinytoes-data", isDirectory: true)
  }

  private func storeDir(_ store: String) -> URL {
    baseDir.appendingPathComponent(store, isDirectory: true)
  }

  private func keyFile(_ store: String, _ key: String) -> URL {
    storeDir(store).appendingPathComponent("\(key).json")
  }

  private func ensureDir(_ url: URL) throws {
    if !FileManager.default.fileExists(atPath: url.path) {
      try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    }
  }

  /// Get a single value by key. Returns the raw JSON string or nil.
  func get(store: String, key: String) throws -> String? {
    let file = keyFile(store, key)
    guard FileManager.default.fileExists(atPath: file.path) else { return nil }
    return try String(contentsOf: file, encoding: .utf8)
  }

  /// Get all values in a store as a JSON array string.
  func getAll(store: String) throws -> String {
    let dir = storeDir(store)
    guard FileManager.default.fileExists(atPath: dir.path) else { return "[]" }

    let files = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
      .filter { $0.pathExtension == "json" }

    var items: [String] = []
    for file in files {
      let content = try String(contentsOf: file, encoding: .utf8)
      items.append(content)
    }
    return "[\(items.joined(separator: ","))]"
  }

  /// Put a value (raw JSON string) for a key.
  func put(store: String, key: String, value: String) throws {
    let dir = storeDir(store)
    try ensureDir(dir)
    let file = keyFile(store, key)
    try value.write(to: file, atomically: true, encoding: .utf8)
  }

  /// Delete a single key.
  func delete(store: String, key: String) throws {
    let file = keyFile(store, key)
    if FileManager.default.fileExists(atPath: file.path) {
      try FileManager.default.removeItem(at: file)
    }
  }

  /// Clear all keys in a store.
  func clear(store: String) throws {
    let dir = storeDir(store)
    if FileManager.default.fileExists(atPath: dir.path) {
      try FileManager.default.removeItem(at: dir)
    }
  }
}
