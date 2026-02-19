namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the AI Thinking Skeleton blog post.
/// </summary>
public class _20260219120000_AddAiThinkingSkeletonBlogPost : ContentMigration
{
    public override string Description => "Add AI Thinking Skeleton blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "ai-thinking-skeleton",
            new
            {
                slug = "ai-thinking-skeleton",
                title = "Creating AI Thinking Skeleton Loaders with React",
                excerpt = "Build elegant shimmer, pulse, and wave skeleton animations for AI loading states. Composable primitives for chat responses, code blocks, cards, and analysis panels.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "AI", "UI/UX" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=450&fit=crop",
                    alt = "Abstract loading animation with shimmer effect"
                },
                demoComponent = "ai-thinking-skeleton",
                mdxFile = "/content/blog/ai-thinking-skeleton.md",
                readTime = "7 min read",
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
            "ai-thinking-skeleton");

        await ctx.SaveChangesAsync();
    }
}
