namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the AI Chat Bubble blog post.
/// </summary>
public class _20260219100000_AddAiChatBubbleBlogPost : ContentMigration
{
    public override string Description => "Add AI Chat Bubble blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "ai-chat-bubble",
            new
            {
                slug = "ai-chat-bubble",
                title = "Building an AI Chat Bubble Component with React",
                excerpt = "Create a polished AI chat interface with streaming text animation, typing indicators, and message bubbles. Perfect for chatbot UIs and AI assistant applications.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS", "Animation", "AI", "UI/UX" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
                    alt = "AI chat interface with streaming messages"
                },
                demoComponent = "ai-chat-bubble",
                mdxFile = "/content/blog/ai-chat-bubble.md",
                readTime = "8 min read",
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
            "ai-chat-bubble");

        await ctx.SaveChangesAsync();
    }
}
