namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the Animated Modal Dialogs blog post.
/// </summary>
public class _20260105130000_AddAnimatedModalDialogsBlogPost : ContentMigration
{
    public override string Description => "Add Animated Modal Dialogs blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "animated-modal-dialogs",
            new
            {
                slug = "animated-modal-dialogs",
                title = "Building Animated Modal Dialogs with React",
                excerpt = "Create smooth, accessible modal dialogs with multiple animation types, backdrop blur effects, and responsive design. Perfect for confirmations, alerts, and user interactions.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "UI/UX" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
                    alt = "Code editor with dark theme showing modal dialog implementation"
                },
                demoComponent = "animated-modal-dialogs",
                mdxFile = "/content/blog/animated-modal-dialogs.md",
                readTime = "10 min read",
                publishedDate = "2026-01-05",
                isPublished = true
            });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        await ctx.DeleteContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "animated-modal-dialogs");

        await ctx.SaveChangesAsync();
    }
}