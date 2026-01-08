namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the Progress Bars with CSS Animations blog post.
/// </summary>
public class _20260105124000_AddProgressBarsCssAnimationsBlogPost : ContentMigration
{
    public override string Description => "Add Progress Bars with CSS Animations blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "progress-bars-css-animations",
            new
            {
                slug = "progress-bars-css-animations",
                title = "Building Progress Bars with CSS Animations in React",
                excerpt = "Create engaging progress bars with multiple animation styles, loading states, and customizable designs. Perfect for file uploads, data processing, and task completion indicators.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "UI/UX" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "Code editor with progress indicators and animations"
                },
                demoComponent = "progress-bars-css-animations",
                mdxFile = "/content/blog/progress-bars-css-animations.md",
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
            "progress-bars-css-animations");

        await ctx.SaveChangesAsync();
    }
}