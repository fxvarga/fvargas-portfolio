namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates the Executive Catering CT portfolio.
/// This is a separate portfolio from 1 Stop Wings (which is a sub-brand).
/// The Executive Catering site has its own landing page and inquiry form.
/// </summary>
public class _20260316000000_ExecutiveCateringPortfolio : ContentMigration
{
    public override string Description => "Create Executive Catering CT portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertPortfolioAsync(
            ContentMigrationContext.ExecutiveCateringPortfolioId,
            "executivecatering",
            p => p
                .Name("Executive Catering CT")
                .Domain("executivecateringct.com")
                .Description("Executive Catering CT - Full-service corporate catering in Connecticut")
                .IsActive(true));

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        await ctx.DeletePortfolioAsync(ContentMigrationContext.ExecutiveCateringPortfolioId);
        await ctx.SaveChangesAsync();
    }
}
