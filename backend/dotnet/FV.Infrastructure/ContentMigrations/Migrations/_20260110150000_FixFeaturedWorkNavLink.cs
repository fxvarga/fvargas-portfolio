namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Fixes the Featured Work navigation link from "featured-work" to "services".
/// The navigation should scroll to the #services section on the page.
/// </summary>
public class _20260110150000_FixFeaturedWorkNavLink : ContentMigration
{
    public override string Description => "Fix Featured Work navigation link to use #services";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "navigation",
            "default",
            new
            {
                logo = new
                {
                    url = "/assets/images/logo.png",
                    alt = "Logo"
                },
                menuItems = new[]
                {
                    new { id = 1, title = "Home", link = "home" },
                    new { id = 2, title = "About", link = "about" },
                    new { id = 3, title = "Featured Work", link = "services" },
                    new { id = 4, title = "Contact", link = "contact" }
                },
                searchPlaceholder = "Search here...",
                devModeLabel = "INSIGHTS MODE ON",
                insightsLabel = "Insights"
            });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        // Revert to original "featured-work" link
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "navigation",
            "default",
            new
            {
                logo = new
                {
                    url = "/assets/images/logo.png",
                    alt = "Logo"
                },
                menuItems = new[]
                {
                    new { id = 1, title = "Home", link = "home" },
                    new { id = 2, title = "About", link = "about" },
                    new { id = 3, title = "Featured Work", link = "featured-work" },
                    new { id = 4, title = "Contact", link = "contact" }
                },
                searchPlaceholder = "Search here...",
                devModeLabel = "INSIGHTS MODE ON",
                insightsLabel = "Insights"
            });

        await ctx.SaveChangesAsync();
    }
}
