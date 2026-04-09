namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates the Brad Earnhardt portfolio.
/// Brad is a Senior UI/UX Designer based in Charlotte, NC
/// with 20+ years of experience in user-centered design and development.
/// </summary>
public class _20260401000000_BradPortfolio : ContentMigration
{
    public override string Description => "Create Brad Earnhardt portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertPortfolioAsync(
            ContentMigrationContext.BradPortfolioId,
            "brad",
            p => p
                .Name("Brad Earnhardt")
                .Domain("brad.fernando-vargas.com")
                .Description("Brad Earnhardt - Senior UI/UX Designer portfolio showcasing user-centered design and development work")
                .IsActive(true));

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        await ctx.DeletePortfolioAsync(ContentMigrationContext.BradPortfolioId);
        await ctx.SaveChangesAsync();
    }
}
