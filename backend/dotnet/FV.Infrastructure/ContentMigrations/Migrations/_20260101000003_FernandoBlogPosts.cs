namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Seeds initial blog posts for Fernando's portfolio Learning Lab.
/// </summary>
public class _20260101000003_FernandoBlogPosts : ContentMigration
{
    public override string Description => "Create initial blog posts for Fernando portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

        // Blog Post 1: Codrops Dropdown Navigation
        await ctx.UpsertContentAsync(portfolioId, "blog-post", "codrops-dropdown-navigation", new
        {
            slug = "codrops-dropdown-navigation",
            title = "Building a Codrops-Style Dropdown Navigation with React",
            excerpt = "Learn how to create an animated dropdown navigation menu inspired by Codrops, featuring sliding indicators, staggered animations, and smooth hover transitions using React and CSS.",
            category = "Frontend",
            tags = new[] { "React", "CSS", "Animation", "Navigation", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop",
                alt = "Dropdown Navigation Demo - Code on screen"
            },
            demoComponent = "dropdown-navigation",
            mdxFile = "/content/blog/codrops-dropdown-navigation.md",
            readTime = "8 min read",
            publishedDate = "2025-01-03",
            isPublished = true
        });

        // Blog Post 2: Magnetic Button Effect
        await ctx.UpsertContentAsync(portfolioId, "blog-post", "magnetic-button-effect", new
        {
            slug = "magnetic-button-effect",
            title = "Creating Magnetic Button Effects with React",
            excerpt = "Build captivating magnetic button effects that follow the cursor, adding delightful micro-interactions to your web applications using React and CSS transforms.",
            category = "Frontend",
            tags = new[] { "React", "CSS", "Animation", "Micro-interactions", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop",
                alt = "Magnetic Button Demo - Abstract magnetic field"
            },
            demoComponent = "magnetic-button",
            mdxFile = "/content/blog/magnetic-button-effect.md",
            readTime = "6 min read",
            publishedDate = "2025-01-04",
            isPublished = true
        });

        // Blog Post 3: Animated Counters
        await ctx.UpsertContentAsync(portfolioId, "blog-post", "animated-counters", new
        {
            slug = "animated-counters",
            title = "Building Scroll-Triggered Animated Counters",
            excerpt = "Create engaging animated number counters that trigger on scroll, perfect for displaying statistics and achievements with smooth easing animations.",
            category = "Frontend",
            tags = new[] { "React", "Animation", "Intersection Observer", "Statistics", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                alt = "Animated Counters Demo - Data dashboard"
            },
            demoComponent = "animated-counter",
            mdxFile = "/content/blog/animated-counters.md",
            readTime = "7 min read",
            publishedDate = "2025-01-05",
            isPublished = true
        });

        // Blog Post 4: Typing Effect Animation
        await ctx.UpsertContentAsync(portfolioId, "blog-post", "typing-effect-animation", new
        {
            slug = "typing-effect-animation",
            title = "Creating a Typewriter Effect with React",
            excerpt = "Build a dynamic typing effect component that cycles through phrases with realistic typing and deleting animations, perfect for hero sections and landing pages.",
            category = "Frontend",
            tags = new[] { "React", "Animation", "TypeScript", "Typography", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=800&h=450&fit=crop",
                alt = "Typing Effect Demo - Vintage typewriter"
            },
            demoComponent = "typing-effect",
            mdxFile = "/content/blog/typing-effect-animation.md",
            readTime = "8 min read",
            publishedDate = "2025-01-06",
            isPublished = true
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

        await ctx.DeleteContentAsync(portfolioId, "blog-post", "typing-effect-animation");
        await ctx.DeleteContentAsync(portfolioId, "blog-post", "animated-counters");
        await ctx.DeleteContentAsync(portfolioId, "blog-post", "magnetic-button-effect");
        await ctx.DeleteContentAsync(portfolioId, "blog-post", "codrops-dropdown-navigation");

        await ctx.SaveChangesAsync();
    }
}
