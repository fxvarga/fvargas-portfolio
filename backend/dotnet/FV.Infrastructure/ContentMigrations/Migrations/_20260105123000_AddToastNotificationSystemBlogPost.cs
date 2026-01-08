namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the Toast Notification System blog post.
/// </summary>
public class _20260105123000_AddToastNotificationSystemBlogPost : ContentMigration
{
    public override string Description => "Add Toast Notification System blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "toast-notification-system",
            new
            {
                slug = "toast-notification-system",
                title = "Building a Toast Notification System with React",
                excerpt = "Create animated toast notifications with multiple types, positions, and queue management. Perfect for providing user feedback, alerts, and status updates in modern web applications.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "UI/UX", "Hooks" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "Code editor with notification system interface"
                },
                demoComponent = "toast-notification-system",
                mdxFile = "/content/blog/toast-notification-system.md",
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
            "toast-notification-system");

        await ctx.SaveChangesAsync();
    }
}