namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the Lightroom-Style Photo Gallery blog post.
/// A comprehensive tutorial on building a professional photo gallery with modal lightbox,
/// keyboard navigation, zoom functionality, and EXIF metadata display.
/// </summary>
public class _20260110140000_AddPhotoGalleryBlogPost : ContentMigration
{
    public override string Description => "Add lightroom-style photo gallery blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "lightroom-photo-gallery",
            new
            {
                slug = "lightroom-photo-gallery",
                title = "Building a Lightroom-Style Photo Gallery with React",
                excerpt = "Create a professional photo gallery with modal lightbox, keyboard navigation, zoom functionality, and EXIF metadata display inspired by Adobe Lightroom.",
                category = "Frontend",
                tags = new[] { "React", "TypeScript", "CSS Grid", "Gallery", "UI/UX", "Animation" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop",
                    alt = "Photo Gallery Demo - Mountain landscape photography"
                },
                demoComponent = "photo-gallery",
                mdxFile = "/content/blog/lightroom-photo-gallery.md",
                readTime = "10 min read",
                publishedDate = "2025-01-10",
                isPublished = true
            });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        await ctx.DeleteContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "lightroom-photo-gallery");

        await ctx.SaveChangesAsync();
    }
}
