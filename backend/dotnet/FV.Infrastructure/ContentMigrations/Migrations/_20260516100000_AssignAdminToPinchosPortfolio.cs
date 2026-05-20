namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Assigns the admin user to the Pinchos Lounge portfolio.
/// </summary>
public class _20260516100000_AssignAdminToPinchosPortfolio : ContentMigration
{
    public override string Description => "Assign admin user to Pinchos Lounge portfolio";

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
