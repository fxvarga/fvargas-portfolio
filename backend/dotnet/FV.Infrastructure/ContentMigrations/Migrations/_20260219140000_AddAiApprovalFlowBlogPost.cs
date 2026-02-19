namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the AI Approval Flow blog post.
/// </summary>
public class _20260219140000_AddAiApprovalFlowBlogPost : ContentMigration
{
    public override string Description => "Add AI Approval Flow blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "ai-approval-flow",
            new
            {
                slug = "ai-approval-flow",
                title = "Building an AI Approval Flow with React",
                excerpt = "Create a human-in-the-loop approval interface for AI-proposed actions with risk levels, expandable details, and approve/modify/reject controls for safe AI workflows.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "AI", "UI/UX" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "Dashboard interface showing approval workflow"
                },
                demoComponent = "ai-approval-flow",
                mdxFile = "/content/blog/ai-approval-flow.md",
                readTime = "10 min read",
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
            "ai-approval-flow");

        await ctx.SaveChangesAsync();
    }
}
