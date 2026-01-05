using System.Text.RegularExpressions;

namespace FV.Infrastructure.ContentMigrations;

/// <summary>
/// Base class for content migrations. Inspired by Rails ActiveRecord::Migration.
/// Provides common functionality and a clean interface for writing migrations.
/// </summary>
public abstract partial class ContentMigration : IContentMigration
{
    /// <summary>
    /// The migration ID is derived from the class name, which should follow the pattern:
    /// _YYYYMMDDHHMMSS_Name (e.g., _20260104120000_AddWorkflowBlogPost)
    /// </summary>
    public virtual string MigrationId
    {
        get
        {
            var className = GetType().Name;
            // Extract timestamp and name from class name pattern
            var match = MigrationIdRegex().Match(className);
            if (match.Success)
            {
                return $"{match.Groups[1].Value}_{match.Groups[2].Value}";
            }
            // Fallback to class name if pattern doesn't match
            return className;
        }
    }

    /// <summary>
    /// Override this to provide a description of what the migration does.
    /// </summary>
    public abstract string Description { get; }

    /// <summary>
    /// Apply the migration.
    /// </summary>
    public abstract Task UpAsync(ContentMigrationContext context);

    /// <summary>
    /// Rollback the migration. Override this for reversible migrations.
    /// Default implementation throws NotImplementedException.
    /// </summary>
    public virtual Task DownAsync(ContentMigrationContext context)
    {
        throw new NotImplementedException(
            $"Migration {MigrationId} does not support rollback. " +
            "Override DownAsync to make it reversible.");
    }

    /// <summary>
    /// Whether this migration can be rolled back.
    /// Returns true if DownAsync is overridden.
    /// </summary>
    public virtual bool IsReversible =>
        GetType().GetMethod(nameof(DownAsync))?.DeclaringType != typeof(ContentMigration);

    [GeneratedRegex(@"_(\d{14})_(.+)")]
    private static partial Regex MigrationIdRegex();
}
