namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Assigns the admin user to all portfolios, including Executive Catering
/// and OpsBlueprint which were added after the initial admin user setup.
/// EnsureAdminUserAsync is idempotent — it only creates missing assignments.
/// </summary>
public class _20260328200000_AssignAdminToAllPortfolios : ContentMigration
{
    public override string Description => "Assign admin user to all portfolios (including Executive Catering and OpsBlueprint)";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var adminPassword = Environment.GetEnvironmentVariable("CMS_ADMIN_PASSWORD") ?? "admin123";
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
        await ctx.EnsureAdminUserAsync("admin", passwordHash);
        await ctx.SaveChangesAsync();
    }

    public override Task DownAsync(ContentMigrationContext ctx)
    {
        // No-op: removing admin access is destructive and rarely desired.
        // If needed, manually remove UserPortfolio rows for the two new portfolios.
        return Task.CompletedTask;
    }
}
