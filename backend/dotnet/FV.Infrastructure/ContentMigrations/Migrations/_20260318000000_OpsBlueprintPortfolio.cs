namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates the OpsBlueprint portfolio.
/// OpsBlueprint is a workflow automation consulting firm landing page
/// with a lead capture form that feeds into n8n automation workflows.
/// </summary>
public class _20260318000000_OpsBlueprintPortfolio : ContentMigration
{
    public override string Description => "Create OpsBlueprint portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertPortfolioAsync(
            ContentMigrationContext.OpsBlueprintPortfolioId,
            "opsblueprint",
            p => p
                .Name("OpsBlueprint")
                .Domain("opsblueprint.fernando-vargas.com")
                .Description("OpsBlueprint - Workflow automation consulting for small and mid-size businesses")
                .IsActive(true));

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        await ctx.DeletePortfolioAsync(ContentMigrationContext.OpsBlueprintPortfolioId);
        await ctx.SaveChangesAsync();
    }
}
