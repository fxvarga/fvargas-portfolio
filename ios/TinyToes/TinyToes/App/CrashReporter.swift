import Foundation
import os

/// Captures native crashes — uncaught `NSException`s (e.g. UIKit/CloudKit internal
/// inconsistency exceptions) and fatal POSIX signals — to disk so they can be
/// recovered on the next launch.
///
/// This is intentionally independent of the JS / Application Insights web SDK, which
/// cannot observe a native iOS crash and may never flush before the process dies.
/// On the next launch the persisted report is read back and forwarded into the
/// WebView telemetry pipeline (and always logged via `os_log`).
final class CrashReporter {
  static let shared = CrashReporter()

  private let log = Logger(subsystem: "com.tinytoes.app", category: "crash")
  private let breadcrumbsLock = NSLock()
  private var breadcrumbs: [String] = []
  private let maxBreadcrumbs = 40

  /// Set once an uncaught `NSException` report has been persisted, so the subsequent
  /// SIGABRT (raised by the runtime when it aborts) does not overwrite the richer
  /// exception report with a generic signal report.
  fileprivate var didCaptureException = false

  private lazy var directory: URL = {
    let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
      ?? FileManager.default.temporaryDirectory
    return base.appendingPathComponent("TinyToesDiagnostics", isDirectory: true)
  }()

  private var crashFileURL: URL { directory.appendingPathComponent("last-crash.json") }

  private init() {}

  // MARK: - Installation

  /// Installs the uncaught-exception and signal handlers. Call as early as possible
  /// (e.g. in `application(_:didFinishLaunchingWithOptions:)`).
  func install() {
    ensureDirectory()
    installExceptionHandler()
    installSignalHandlers()
    leaveBreadcrumb("crash_reporter_installed")
  }

  private func ensureDirectory() {
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  }

  private func installExceptionHandler() {
    NSSetUncaughtExceptionHandler { exception in
      CrashReporter.shared.record(
        type: "uncaughtException",
        name: exception.name.rawValue,
        reason: exception.reason ?? "(no reason)",
        signalName: nil,
        callStack: exception.callStackSymbols
      )
      // Mark that we already captured the rich exception so the impending SIGABRT
      // signal handler doesn't clobber it.
      CrashReporter.shared.didCaptureException = true
    }
  }

  private func installSignalHandlers() {
    let fatalSignals: [Int32] = [SIGABRT, SIGILL, SIGSEGV, SIGFPE, SIGBUS, SIGTRAP]
    for fatalSignal in fatalSignals {
      _ = signal(fatalSignal) { signalNumber in
        // If an uncaught NSException was just recorded, keep that richer report.
        if !CrashReporter.shared.didCaptureException {
          CrashReporter.shared.record(
            type: "signal",
            name: CrashReporter.signalName(signalNumber),
            reason: "Fatal signal \(signalNumber)",
            signalName: CrashReporter.signalName(signalNumber),
            callStack: Thread.callStackSymbols
          )
        }
        // Restore the default handler and re-raise so the OS still produces its own crash report.
        _ = signal(signalNumber, SIG_DFL)
        raise(signalNumber)
      }
    }
  }

  // MARK: - Breadcrumbs

  /// Records a lightweight breadcrumb that is included in the next crash report.
  func leaveBreadcrumb(_ message: String) {
    let entry = "\(Self.timestamp()) \(message)"
    log.debug("breadcrumb: \(message, privacy: .public)")
    breadcrumbsLock.lock()
    breadcrumbs.append(entry)
    if breadcrumbs.count > maxBreadcrumbs {
      breadcrumbs.removeFirst(breadcrumbs.count - maxBreadcrumbs)
    }
    breadcrumbsLock.unlock()
  }

  private func breadcrumbSnapshot() -> [String] {
    // Best-effort read for the crash path; never block here to avoid deadlocking a crashing thread.
    breadcrumbsLock.lock()
    let snapshot = breadcrumbs
    breadcrumbsLock.unlock()
    return snapshot
  }

  // MARK: - Recording

  private func record(type: String, name: String, reason: String, signalName: String?, callStack: [String]) {
    log.fault("Native crash captured: \(type, privacy: .public) \(name, privacy: .public) — \(reason, privacy: .public)")

    let info = Bundle.main.infoDictionary
    var report: [String: Any] = [
      "type": type,
      "name": name,
      "reason": reason,
      "callStack": Array(callStack.prefix(40)),
      "breadcrumbs": breadcrumbSnapshot(),
      "appVersion": (info?["CFBundleShortVersionString"] as? String) ?? "unknown",
      "buildNumber": (info?["CFBundleVersion"] as? String) ?? "unknown",
      "timestamp": Self.timestamp()
    ]
    if let signalName {
      report["signalName"] = signalName
    }

    guard let data = try? JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted]) else { return }
    try? data.write(to: crashFileURL, options: [.atomic])
  }

  // MARK: - Recovery

  /// Returns and clears the most recent persisted crash report, if any.
  func consumePendingReport() -> [String: Any]? {
    guard let data = try? Data(contentsOf: crashFileURL) else { return nil }
    try? FileManager.default.removeItem(at: crashFileURL)
    return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
  }

  // MARK: - Helpers

  private static func timestamp() -> String {
    ISO8601DateFormatter().string(from: Date())
  }

  private static func signalName(_ signalNumber: Int32) -> String {
    switch signalNumber {
    case SIGABRT: return "SIGABRT"
    case SIGILL: return "SIGILL"
    case SIGSEGV: return "SIGSEGV"
    case SIGFPE: return "SIGFPE"
    case SIGBUS: return "SIGBUS"
    case SIGTRAP: return "SIGTRAP"
    default: return "SIG\(signalNumber)"
    }
  }
}
