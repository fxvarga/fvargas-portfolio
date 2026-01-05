namespace FV.Infrastructure.ContentMigrations;

/// <summary>
/// Interface for content migrations, inspired by Rails ActiveRecord migrations.
/// Each migration represents a reversible change to content data.
/// </summary>
public interface IContentMigration
{
    /// <summary>
    /// Unique identifier for this migration, format: "YYYYMMDDHHMMSS_Name"
    /// Example: "20260104120000_AddWorkflowBlogPost"
    /// </summary>
    string MigrationId { get; }

    /// <summary>
    /// Human-readable description of what this migration does
    /// </summary>
    string Description { get; }

    /// <summary>
    /// Apply the migration (create/update content)
    /// </summary>
    Task UpAsync(ContentMigrationContext context);

    /// <summary>
    /// Rollback the migration (remove/revert content)
    /// Optional - some migrations may not be reversible
    /// </summary>
    Task DownAsync(ContentMigrationContext context);

    /// <summary>
    /// Whether this migration can be rolled back
    /// </summary>
    bool IsReversible { get; }
}
