namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the AI Tool Call Card blog post.
/// </summary>
public class _20260219130000_AddAiToolCallCardBlogPost : ContentMigration
{
    public override string Description => "Add AI Tool Call Card blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "ai-tool-call-card",
            new
            {
                slug = "ai-tool-call-card",
                title = "Building AI Tool Call Cards with React",
                excerpt = "Create expandable cards that visualize AI agent tool executions with status indicators, input/output panels, and animated state transitions for transparent AI interfaces.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "AI", "UI/UX" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop",
                    alt = "Laptop with code showing tool call interface"
                },
                demoComponent = "ai-tool-call-card",
                mdxFile = "/content/blog/ai-tool-call-card.md",
                readTime = "9 min read",
                publishedDate = "2026-02-19",
                isPublished = true
            });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        await ctx.DeleteContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "ai-tool-call-card");

        await ctx.SaveChangesAsync();
    }
}
