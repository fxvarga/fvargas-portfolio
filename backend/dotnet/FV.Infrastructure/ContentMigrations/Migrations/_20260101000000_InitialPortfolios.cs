using FV.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Initial migration that creates portfolios, admin user, and assigns permissions.
/// This is the foundation that all other migrations depend on.
/// </summary>
public class _20260101000000_InitialPortfolios : ContentMigration
{
    public override string Description => "Create initial portfolios and admin user";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        // Create Fernando portfolio
        await ctx.UpsertPortfolioAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "fernando",
            p => p
                .Name("Fernando Vargas Portfolio")
                .Domain("fernando-vargas.com")
                .Description("Senior Full-Stack Engineer portfolio")
                .IsActive(true));

        // Create Jessica portfolio  
        await ctx.UpsertPortfolioAsync(
            ContentMigrationContext.JessicaPortfolioId,
            "jessica",
            p => p
                .Name("Jessica Sutherland Portfolio")
                .Domain("jessicasutherland.me")
                .Description("Jessica Sutherland's portfolio")
                .IsActive(true));

        // Create Busybee portfolio
        await ctx.UpsertPortfolioAsync(
            ContentMigrationContext.BusybeePortfolioId,
            "busybee",
            p => p
                .Name("The Busy Bee Web")
                .Domain("thebusybeeweb.com")
                .Description("The Busy Bee Web portfolio")
                .IsActive(true));

        await ctx.SaveChangesAsync();

        // Create admin user and assign to all portfolios
        var adminPassword = Environment.GetEnvironmentVariable("CMS_ADMIN_PASSWORD") ?? "admin123";
        var authService = ctx.Services.GetService(typeof(IAuthService)) as IAuthService;

        if (authService != null)
        {
            var existingUser = await ctx.Database.Users
                .FirstOrDefaultAsync(u => u.Username == "admin");

            if (existingUser == null)
            {
                await authService.CreateUserAsync("admin", adminPassword, "Admin");
            }
        }

        // Assign admin to all portfolios is handled separately to work even without auth service
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
        await ctx.EnsureAdminUserAsync("admin", passwordHash);
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        // Cascade delete will handle related entities
        await ctx.DeletePortfolioAsync(ContentMigrationContext.BusybeePortfolioId);
        await ctx.DeletePortfolioAsync(ContentMigrationContext.JessicaPortfolioId);
        await ctx.DeletePortfolioAsync(ContentMigrationContext.FernandoPortfolioId);
        await ctx.SaveChangesAsync();
    }
}
