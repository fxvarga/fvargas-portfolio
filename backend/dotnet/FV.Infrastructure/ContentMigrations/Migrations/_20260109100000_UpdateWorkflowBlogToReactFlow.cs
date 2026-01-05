namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Updates the Workflow Execution GUI blog post to reflect the React Flow implementation.
/// Changes title and excerpt to properly reference React Flow library.
/// </summary>
public class _20260109100000_UpdateWorkflowBlogToReactFlow : ContentMigration
{
    public override string Description => "Update workflow blog post to reference React Flow";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "workflow-execution-gui",
            new
            {
                slug = "workflow-execution-gui",
                title = "Building a Workflow Execution GUI with React Flow",
                excerpt = "Create a visual workflow builder with React Flow featuring real-time execution progress, custom nodes with status indicators, animated edges, MiniMap navigation, and branching logic.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "React Flow", "Animation", "UI/UX", "Workflow" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "Workflow Execution GUI - React Flow visualization"
                },
                demoComponent = "workflow-executor",
                mdxFile = "/content/blog/workflow-execution-gui.md",
                readTime = "12 min read",
                publishedDate = "2025-01-07",
                isPublished = true
            });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        // Revert to original title
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "workflow-execution-gui",
            new
            {
                slug = "workflow-execution-gui",
                title = "Building a Workflow Execution GUI with React",
                excerpt = "Create a visual workflow builder with real-time execution progress tracking, animated connectors, and status indicators inspired by tools like Asana, Zapier, and n8n.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "Animation", "UI/UX", "Workflow" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "Workflow Execution GUI - Data flow visualization"
                },
                demoComponent = "workflow-executor",
                mdxFile = "/content/blog/workflow-execution-gui.md",
                readTime = "12 min read",
                publishedDate = "2025-01-07",
                isPublished = true
            });

        await ctx.SaveChangesAsync();
    }
}
