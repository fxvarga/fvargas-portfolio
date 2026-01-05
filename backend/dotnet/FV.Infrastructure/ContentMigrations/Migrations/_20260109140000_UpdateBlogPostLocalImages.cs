namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Updates blog post featured images with local demo screenshots captured from the live site.
/// These screenshots show the actual interactive demos for each blog post.
/// </summary>
public class _20260109140000_UpdateBlogPostLocalImages : ContentMigration
{
    public override string Description => "Update blog post featured images with local demo screenshots";

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
                url = "/images/blog-demos/dropdown-navigation.png",
                alt = "Dropdown Navigation Demo - Interactive navigation component with animated dropdowns"
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
                url = "/images/blog-demos/magnetic-button.png",
                alt = "Magnetic Button Demo - Interactive button that follows cursor movement"
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
                url = "/images/blog-demos/animated-counters.png",
                alt = "Animated Counters Demo - Statistics counters with scroll-triggered animations"
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
                url = "/images/blog-demos/typing-effect.png",
                alt = "Typing Effect Demo - Typewriter animation cycling through phrases"
            },
            demoComponent = "typing-effect",
            mdxFile = "/content/blog/typing-effect-animation.md",
            readTime = "8 min read",
            publishedDate = "2025-01-06",
            isPublished = true
        });

        // Blog Post 5: Workflow Execution GUI
        await ctx.UpsertContentAsync(portfolioId, "blog-post", "workflow-execution-gui", new
        {
            slug = "workflow-execution-gui",
            title = "Building a Workflow Execution GUI with React",
            excerpt = "Create a visual workflow builder with real-time execution progress tracking, animated connectors, and status indicators inspired by tools like Asana, Zapier, and n8n.",
            category = "Frontend",
            tags = new[] { "React", "TypeScript", "Animation", "UI/UX", "Workflow" },
            featuredImage = new
            {
                url = "/images/blog-demos/workflow-executor.png",
                alt = "Workflow Executor Demo - Visual workflow builder with execution progress"
            },
            demoComponent = "workflow-executor",
            mdxFile = "/content/blog/workflow-execution-gui.md",
            readTime = "12 min read",
            publishedDate = "2025-01-07",
            isPublished = true
        });

        // Blog Post 6: FluentUI Dynamic DataGrid
        await ctx.UpsertContentAsync(portfolioId, "blog-post", "fluentui-dynamic-datagrid", new
        {
            slug = "fluentui-dynamic-datagrid",
            title = "Building a Dynamic Data Grid with FluentUI 8",
            excerpt = "Create a fully-featured data grid with sorting, filtering, pagination, inline editing, column resizing, row grouping, and CSV export - all with React and TypeScript.",
            category = "Frontend",
            tags = new[] { "React", "FluentUI", "TypeScript", "Data Grid", "UI/UX", "Enterprise" },
            featuredImage = new
            {
                url = "/images/blog-demos/fluentui-datagrid.png",
                alt = "FluentUI DataGrid Demo - Enterprise data grid with sorting, filtering, and pagination"
            },
            demoComponent = "fluentui-datagrid",
            mdxFile = "/content/blog/fluentui-dynamic-datagrid.md",
            readTime = "15 min read",
            publishedDate = "2025-01-08",
            isPublished = true
        });

        // Blog Post 7: File Upload Progress
        await ctx.UpsertContentAsync(portfolioId, "blog-post", "file-upload-progress", new
        {
            slug = "file-upload-progress",
            title = "Building a File Upload Component with Progress Tracking",
            excerpt = "Learn how to create a comprehensive file upload component featuring drag-and-drop functionality, progress tracking, and animated processing steps using React and TypeScript.",
            category = "Frontend",
            tags = new[] { "React", "TypeScript", "Animation", "UI/UX", "File Upload" },
            featuredImage = new
            {
                url = "/images/blog-demos/file-upload-progress.png",
                alt = "File Upload Progress Demo - Drag-and-drop upload with progress tracking"
            },
            demoComponent = "file-upload-progress",
            mdxFile = "/content/blog/file-upload-progress.md",
            readTime = "10 min read",
            publishedDate = "2025-01-08",
            isPublished = true
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        // Revert to Pexels images from previous migration
        // This would call the previous migration's Up method or store old values
        await Task.CompletedTask;
    }
}
