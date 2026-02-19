namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the AI Prompt Input blog post.
/// </summary>
public class _20260219110000_AddAiPromptInputBlogPost : ContentMigration
{
    public override string Description => "Add AI Prompt Input blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "ai-prompt-input",
            new
            {
                slug = "ai-prompt-input",
                title = "Building an AI Prompt Input with React",
                excerpt = "Create a polished AI prompt input with auto-resizing textarea, model selector, character limits, and keyboard shortcuts. Essential for chatbot and AI-powered applications.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "AI", "UI/UX", "Hooks" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
                    alt = "Code editor with dark theme showing a prompt interface"
                },
                demoComponent = "ai-prompt-input",
                mdxFile = "/content/blog/ai-prompt-input.md",
                readTime = "7 min read",
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
            "ai-prompt-input");

        await ctx.SaveChangesAsync();
    }
}
