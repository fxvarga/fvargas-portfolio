namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Updates the 5 new blog posts with local featured images.
/// </summary>
public class _20260105160000_UpdateNewBlogPostImages : ContentMigration
{
    public override string Description => "Update new blog posts with local featured images";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        // Update Parallax Scrolling Cards
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
                    url = "/images/blog/parallax-scrolling-cards.png",
                    alt = "Parallax scrolling cards demo with 3D depth effects"
                },
                demoComponent = "parallax-scrolling-cards",
                mdxFile = "/content/blog/parallax-scrolling-cards.md",
                readTime = "8 min read",
                publishedDate = "2026-01-05",
                isPublished = true
            });

        // Update Animated Modal Dialogs
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "animated-modal-dialogs",
            new
            {
                slug = "animated-modal-dialogs",
                title = "Creating Animated Modal Dialogs with React",
                excerpt = "Build smooth, accessible modal dialogs with multiple animation types including scale, slide, fade, and bounce effects using React and CSS transitions.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "Accessibility" },
                featuredImage = new
                {
                    url = "/images/blog/animated-modal-dialogs.png",
                    alt = "Animated modal dialogs with multiple animation styles"
                },
                demoComponent = "animated-modal-dialogs",
                mdxFile = "/content/blog/animated-modal-dialogs.md",
                readTime = "10 min read",
                publishedDate = "2026-01-05",
                isPublished = true
            });

        // Update Progress Bars CSS Animations
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "progress-bars-css-animations",
            new
            {
                slug = "progress-bars-css-animations",
                title = "Progress Bars with CSS Animations",
                excerpt = "Learn how to create beautiful, animated progress bars with multiple styles including linear, circular, wave, and dot indicators using pure CSS animations.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "UI Components" },
                featuredImage = new
                {
                    url = "/images/blog/progress-bars-css-animations.png",
                    alt = "Multiple progress bar styles with CSS animations"
                },
                demoComponent = "progress-bars-css-animations",
                mdxFile = "/content/blog/progress-bars-css-animations.md",
                readTime = "7 min read",
                publishedDate = "2026-01-05",
                isPublished = true
            });

        // Update Animated Tab Navigation
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "animated-tab-navigation",
            new
            {
                slug = "animated-tab-navigation",
                title = "Building Animated Tab Navigation with React",
                excerpt = "Create smooth tab navigation components with sliding indicators and content transitions. Features multiple animation types and indicator styles.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "Navigation" },
                featuredImage = new
                {
                    url = "/images/blog/animated-tab-navigation.png",
                    alt = "Animated tab navigation with sliding indicators"
                },
                demoComponent = "animated-tab-navigation",
                mdxFile = "/content/blog/animated-tab-navigation.md",
                readTime = "9 min read",
                publishedDate = "2026-01-05",
                isPublished = true
            });

        // Update Toast Notification System
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "toast-notification-system",
            new
            {
                slug = "toast-notification-system",
                title = "Building a Toast Notification System with React",
                excerpt = "Implement a full-featured toast notification system with multiple types, positions, animations, and auto-dismiss functionality using React and CSS.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "UX" },
                featuredImage = new
                {
                    url = "/images/blog/toast-notification-system.png",
                    alt = "Toast notification system with multiple styles and positions"
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
        // Revert to original Unsplash URLs
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "parallax-scrolling-cards",
            new
            {
                slug = "parallax-scrolling-cards",
                title = "Building Parallax Scrolling Cards with React",
                excerpt = "Create stunning parallax scrolling effects for card layouts that add depth and visual interest to your web applications.",
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
}
