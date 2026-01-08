namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the Parallax Scrolling Cards blog post.
/// </summary>
public class _20260105123000_AddParallaxScrollingCardsBlogPost : ContentMigration
{
    public override string Description => "Add Parallax Scrolling Cards blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "parallax-scrolling-cards",
            new
            {
                slug = "parallax-scrolling-cards",
                title = "Building Parallax Scrolling Cards with React",
                excerpt = "Create stunning parallax scrolling effects for card layouts that add depth and visual interest to your web applications. Perfect for hero sections, portfolio showcases, and storytelling interfaces.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "UI/UX" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop",
                    alt = "Mountain landscape with layered depth effect"
                },
                demoComponent = "parallax-scrolling-cards",
                mdxFile = "/content/blog/parallax-scrolling-cards.md",
                readTime = "8 min read",
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
            "parallax-scrolling-cards");

        await ctx.SaveChangesAsync();
    }
}