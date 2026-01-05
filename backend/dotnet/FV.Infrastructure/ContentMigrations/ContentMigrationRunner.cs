using System.Diagnostics;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FV.Infrastructure.ContentMigrations;

/// <summary>
/// Interface for the content migration runner.
/// </summary>
public interface IContentMigrationRunner
{
    /// <summary>
    /// Applies all pending migrations.
    /// </summary>
    Task<MigrationResult> MigrateAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Rolls back the last N migrations.
    /// </summary>
    Task<MigrationResult> RollbackAsync(int steps = 1, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the status of all migrations.
    /// </summary>
    Task<IReadOnlyList<MigrationStatus>> GetStatusAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Performs a dry run showing what migrations would be applied.
    /// </summary>
    Task<IReadOnlyList<string>> GetPendingMigrationsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of a migration run.
/// </summary>
public class MigrationResult
{
    public bool Success { get; init; }
    public int MigrationsApplied { get; init; }
    public int MigrationsRolledBack { get; init; }
    public TimeSpan TotalTime { get; init; }
    public IReadOnlyList<string> AppliedMigrations { get; init; } = [];
    public string? ErrorMessage { get; init; }
    public string? FailedMigration { get; init; }
}

/// <summary>
/// Status of a single migration.
/// </summary>
public class MigrationStatus
{
    public string MigrationId { get; init; } = default!;
    public string Description { get; init; } = default!;
    public bool IsApplied { get; init; }
    public DateTime? AppliedAt { get; init; }
    public bool IsReversible { get; init; }
    public bool ChecksumMismatch { get; init; }
}

/// <summary>
/// Runs content migrations, inspired by Rails db:migrate and Flyway migrate.
/// Discovers migrations via reflection, tracks applied migrations, and supports rollback.
/// </summary>
public class ContentMigrationRunner : IContentMigrationRunner
{
    private readonly CmsDbContext _db;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ContentMigrationRunner> _logger;
    private readonly Assembly[] _migrationAssemblies;

    public ContentMigrationRunner(
        CmsDbContext db,
        IServiceProvider serviceProvider,
        ILogger<ContentMigrationRunner> logger)
    {
        _db = db;
        _serviceProvider = serviceProvider;
        _logger = logger;
        _migrationAssemblies = [typeof(ContentMigrationRunner).Assembly];
    }

    /// <summary>
    /// Discovers all migration classes from registered assemblies.
    /// </summary>
    private IEnumerable<IContentMigration> DiscoverMigrations()
    {
        return _migrationAssemblies
            .SelectMany(a => a.GetTypes())
            .Where(t => typeof(IContentMigration).IsAssignableFrom(t)
                && !t.IsAbstract
                && !t.IsInterface)
            .Select(t => (IContentMigration)Activator.CreateInstance(t)!)
            .OrderBy(m => m.MigrationId);
    }

    /// <summary>
    /// Computes a checksum for a migration class to detect modifications.
    /// Inspired by Flyway's checksum validation.
    /// </summary>
    private static string ComputeChecksum(Type migrationType)
    {
        // Get the method body of UpAsync for checksum
        var method = migrationType.GetMethod(nameof(IContentMigration.UpAsync));
        var methodBody = method?.GetMethodBody();

        // Combine class name and method body for checksum
        var input = $"{migrationType.FullName}:{methodBody?.GetHashCode() ?? 0}";
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    /// <inheritdoc />
    public async Task<MigrationResult> MigrateAsync(CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var appliedMigrations = new List<string>();

        try
        {
            // Ensure migration history table exists
            await EnsureMigrationHistoryTableAsync(cancellationToken);

            var migrations = DiscoverMigrations().ToList();
            var appliedIds = await _db.ContentMigrationHistory
                .Select(h => h.MigrationId)
                .ToListAsync(cancellationToken);

            var pendingMigrations = migrations
                .Where(m => !appliedIds.Contains(m.MigrationId))
                .ToList();

            if (pendingMigrations.Count == 0)
            {
                _logger.LogInformation("No pending content migrations to apply");
                return new MigrationResult
                {
                    Success = true,
                    MigrationsApplied = 0,
                    TotalTime = stopwatch.Elapsed,
                    AppliedMigrations = appliedMigrations
                };
            }

            _logger.LogInformation("Found {Count} pending content migrations", pendingMigrations.Count);

            foreach (var migration in pendingMigrations)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var migrationStopwatch = Stopwatch.StartNew();
                _logger.LogInformation("Applying migration: {MigrationId} - {Description}",
                    migration.MigrationId, migration.Description);

                try
                {
                    // Create a fresh context for each migration
                    var context = new ContentMigrationContext(_db, _serviceProvider);

                    // Apply the migration
                    await migration.UpAsync(context);
                    await _db.SaveChangesAsync(cancellationToken);

                    migrationStopwatch.Stop();

                    // Record the migration
                    var history = new ContentMigrationHistory
                    {
                        MigrationId = migration.MigrationId,
                        Name = ExtractMigrationName(migration.MigrationId),
                        Description = migration.Description,
                        Checksum = ComputeChecksum(migration.GetType()),
                        AppliedAt = DateTime.UtcNow,
                        ExecutionTimeMs = (int)migrationStopwatch.ElapsedMilliseconds,
                        Success = true
                    };

                    _db.ContentMigrationHistory.Add(history);
                    await _db.SaveChangesAsync(cancellationToken);

                    appliedMigrations.Add(migration.MigrationId);
                    _logger.LogInformation("Applied migration {MigrationId} in {Time}ms",
                        migration.MigrationId, migrationStopwatch.ElapsedMilliseconds);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to apply migration: {MigrationId}", migration.MigrationId);

                    // Record failed migration
                    var history = new ContentMigrationHistory
                    {
                        MigrationId = migration.MigrationId,
                        Name = ExtractMigrationName(migration.MigrationId),
                        Description = migration.Description,
                        Checksum = ComputeChecksum(migration.GetType()),
                        AppliedAt = DateTime.UtcNow,
                        ExecutionTimeMs = (int)migrationStopwatch.ElapsedMilliseconds,
                        Success = false,
                        ErrorMessage = ex.Message
                    };

                    _db.ContentMigrationHistory.Add(history);
                    await _db.SaveChangesAsync(cancellationToken);

                    return new MigrationResult
                    {
                        Success = false,
                        MigrationsApplied = appliedMigrations.Count,
                        TotalTime = stopwatch.Elapsed,
                        AppliedMigrations = appliedMigrations,
                        ErrorMessage = ex.Message,
                        FailedMigration = migration.MigrationId
                    };
                }
            }

            stopwatch.Stop();
            _logger.LogInformation("Applied {Count} content migrations in {Time}ms",
                appliedMigrations.Count, stopwatch.ElapsedMilliseconds);

            return new MigrationResult
            {
                Success = true,
                MigrationsApplied = appliedMigrations.Count,
                TotalTime = stopwatch.Elapsed,
                AppliedMigrations = appliedMigrations
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Content migration failed");
            return new MigrationResult
            {
                Success = false,
                MigrationsApplied = appliedMigrations.Count,
                TotalTime = stopwatch.Elapsed,
                AppliedMigrations = appliedMigrations,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <inheritdoc />
    public async Task<MigrationResult> RollbackAsync(int steps = 1, CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var rolledBackMigrations = new List<string>();

        try
        {
            var migrations = DiscoverMigrations().ToDictionary(m => m.MigrationId);

            // Get the last N successful migrations
            var toRollback = await _db.ContentMigrationHistory
                .Where(h => h.Success)
                .OrderByDescending(h => h.MigrationId)
                .Take(steps)
                .ToListAsync(cancellationToken);

            foreach (var history in toRollback)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!migrations.TryGetValue(history.MigrationId, out var migration))
                {
                    _logger.LogWarning("Migration {MigrationId} not found in codebase, skipping rollback",
                        history.MigrationId);
                    continue;
                }

                if (!migration.IsReversible)
                {
                    _logger.LogWarning("Migration {MigrationId} is not reversible, stopping rollback",
                        history.MigrationId);
                    break;
                }

                _logger.LogInformation("Rolling back migration: {MigrationId}", history.MigrationId);

                try
                {
                    var context = new ContentMigrationContext(_db, _serviceProvider);
                    await migration.DownAsync(context);
                    await _db.SaveChangesAsync(cancellationToken);

                    // Remove the history entry
                    _db.ContentMigrationHistory.Remove(history);
                    await _db.SaveChangesAsync(cancellationToken);

                    rolledBackMigrations.Add(history.MigrationId);
                    _logger.LogInformation("Rolled back migration: {MigrationId}", history.MigrationId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to rollback migration: {MigrationId}", history.MigrationId);
                    return new MigrationResult
                    {
                        Success = false,
                        MigrationsRolledBack = rolledBackMigrations.Count,
                        TotalTime = stopwatch.Elapsed,
                        AppliedMigrations = rolledBackMigrations,
                        ErrorMessage = ex.Message,
                        FailedMigration = history.MigrationId
                    };
                }
            }

            return new MigrationResult
            {
                Success = true,
                MigrationsRolledBack = rolledBackMigrations.Count,
                TotalTime = stopwatch.Elapsed,
                AppliedMigrations = rolledBackMigrations
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rollback failed");
            return new MigrationResult
            {
                Success = false,
                MigrationsRolledBack = rolledBackMigrations.Count,
                TotalTime = stopwatch.Elapsed,
                AppliedMigrations = rolledBackMigrations,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<MigrationStatus>> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var migrations = DiscoverMigrations().ToList();
        var applied = await _db.ContentMigrationHistory
            .ToDictionaryAsync(h => h.MigrationId, cancellationToken);

        return migrations.Select(m =>
        {
            applied.TryGetValue(m.MigrationId, out var history);
            var currentChecksum = ComputeChecksum(m.GetType());

            return new MigrationStatus
            {
                MigrationId = m.MigrationId,
                Description = m.Description,
                IsApplied = history?.Success == true,
                AppliedAt = history?.AppliedAt,
                IsReversible = m.IsReversible,
                ChecksumMismatch = history != null && history.Checksum != currentChecksum
            };
        }).ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> GetPendingMigrationsAsync(CancellationToken cancellationToken = default)
    {
        var migrations = DiscoverMigrations().ToList();
        var appliedIds = await _db.ContentMigrationHistory
            .Where(h => h.Success)
            .Select(h => h.MigrationId)
            .ToListAsync(cancellationToken);

        return migrations
            .Where(m => !appliedIds.Contains(m.MigrationId))
            .Select(m => m.MigrationId)
            .ToList();
    }

    /// <summary>
    /// Ensures the migration history table exists.
    /// </summary>
    private async Task EnsureMigrationHistoryTableAsync(CancellationToken cancellationToken)
    {
        // The table should be created by EF, but we check anyway
        try
        {
            await _db.ContentMigrationHistory.AnyAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ContentMigrationHistory table may not exist, attempting to create");
            await _db.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ContentMigrationHistory (
                    MigrationId TEXT PRIMARY KEY,
                    Name TEXT NOT NULL,
                    Checksum TEXT NOT NULL,
                    AppliedAt TEXT NOT NULL,
                    ExecutionTimeMs INTEGER NOT NULL,
                    Success INTEGER NOT NULL,
                    ErrorMessage TEXT,
                    Description TEXT
                )", cancellationToken);
        }
    }

    /// <summary>
    /// Extracts the migration name from the ID.
    /// </summary>
    private static string ExtractMigrationName(string migrationId)
    {
        var parts = migrationId.Split('_', 2);
        return parts.Length > 1 ? parts[1] : migrationId;
    }
}
