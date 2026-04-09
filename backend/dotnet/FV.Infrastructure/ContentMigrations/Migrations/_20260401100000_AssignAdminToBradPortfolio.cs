namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Assigns the admin user to Brad's portfolio.
/// Brad's portfolio was created in _20260401000000 which runs after the
/// previous EnsureAdminUserAsync migration (_20260328200000), so the
/// admin user was never assigned to it. This migration fixes that.
/// </summary>
public class _20260401100000_AssignAdminToBradPortfolio : ContentMigration
{
    public override string Description => "Assign admin user to Brad Earnhardt portfolio";

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
        return Task.CompletedTask;
    }
}
