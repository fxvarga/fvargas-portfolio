namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the File Upload Progress blog post.
/// A comprehensive tutorial on building file upload components with progress tracking and processing steps.
/// </summary>
public class _20260109120000_AddFileUploadProgressBlogPost : ContentMigration
{
    public override string Description => "Add file upload progress blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "file-upload-progress",
            new
            {
                slug = "file-upload-progress",
                title = "Building a File Upload Component with Progress Tracking",
                excerpt = "Learn how to create a comprehensive file upload component featuring drag-and-drop functionality, progress tracking, and animated processing steps using React and TypeScript.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "Animation", "UI/UX", "File Upload" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "File Upload Progress - Data processing visualization"
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
        await ctx.DeleteContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "file-upload-progress");

        await ctx.SaveChangesAsync();
    }
}