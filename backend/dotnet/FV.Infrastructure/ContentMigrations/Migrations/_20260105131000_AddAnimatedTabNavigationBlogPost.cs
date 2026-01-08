namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the Animated Tab Navigation blog post.
/// </summary>
public class _20260105131000_AddAnimatedTabNavigationBlogPost : ContentMigration
{
    public override string Description => "Add Animated Tab Navigation blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "animated-tab-navigation",
            new
            {
                slug = "animated-tab-navigation",
                title = "Building Animated Tab Navigation with React",
                excerpt = "Create smooth, interactive tab navigation with sliding indicators, content transitions, and customizable animation styles. Perfect for organizing content and improving user experience in dashboards and settings panels.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "UI/UX", "Hooks" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "Code editor with dark theme showing tab navigation interface"
                },
                demoComponent = "animated-tab-navigation",
                mdxFile = "/content/blog/animated-tab-navigation.md",
                readTime = "6 min read",
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
            "animated-tab-navigation");

        await ctx.SaveChangesAsync();
    }
}