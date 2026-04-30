import Foundation

/// Constants matching the IndexedDB store names in the PWA.
enum StorageKeys {
  static let profile = "profile"
  static let entries = "entries"
  static let autoBackups = "autoBackups"
  static let milestones = "milestones"
  static let journal = "journal"
  static let bookProjects = "bookProjects"

  /// All store names for enumeration.
  static let allStores = [profile, entries, autoBackups, milestones, journal, bookProjects]
}
