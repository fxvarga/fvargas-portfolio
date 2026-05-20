namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates the Pinchos Lounge portfolio.
/// Pinchos Lounge is a late-night kabob restaurant and lounge
/// located in New Haven, CT.
/// </summary>
public class _20260516000000_PinchosPortfolio : ContentMigration
{
    public override string Description => "Create Pinchos Lounge portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertPortfolioAsync(
            ContentMigrationContext.PinchosPortfolioId,
            "pinchos",
            p => p
                .Name("Pinchos Lounge")
                .Domain("pinchos.fernando-vargas.com")
                .Description("Pinchos Lounge - Late-night kabobs with lounge vibes in New Haven, CT")
                .IsActive(true));

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        await ctx.DeletePortfolioAsync(ContentMigrationContext.PinchosPortfolioId);
        await ctx.SaveChangesAsync();
    }
}
