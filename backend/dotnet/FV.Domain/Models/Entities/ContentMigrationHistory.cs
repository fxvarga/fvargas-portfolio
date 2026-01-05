namespace FV.Domain.Entities;

/// <summary>
/// Tracks applied content migrations, inspired by Rails schema_migrations and Flyway flyway_schema_history.
/// Each record represents a migration that has been successfully applied to the database.
/// </summary>
public class ContentMigrationHistory
{
    /// <summary>
    /// Unique identifier for the migration, e.g., "20260104120000_AddWorkflowBlogPost"
    /// This is the primary key and follows the Rails timestamp convention.
    /// </summary>
    public string MigrationId { get; set; } = default!;

    /// <summary>
    /// Human-readable name extracted from MigrationId, e.g., "AddWorkflowBlogPost"
    /// </summary>
    public string Name { get; set; } = default!;

    /// <summary>
    /// MD5 checksum of the migration class implementation.
    /// Used to detect if a migration was modified after being applied (Flyway pattern).
    /// </summary>
    public string Checksum { get; set; } = default!;

    /// <summary>
    /// When the migration was applied
    /// </summary>
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// How long the migration took to execute in milliseconds
    /// </summary>
    public int ExecutionTimeMs { get; set; }

    /// <summary>
    /// Whether the migration completed successfully
    /// </summary>
    public bool Success { get; set; } = true;

    /// <summary>
    /// Error message if the migration failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Description of what the migration does
    /// </summary>
    public string? Description { get; set; }
}
