namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Adds the FluentUI Dynamic Data Grid blog post.
/// A comprehensive tutorial on building enterprise-grade data grids with React.
/// </summary>
public class _20260108100000_AddFluentUIDataGridBlogPost : ContentMigration
{
    public override string Description => "Add FluentUI dynamic data grid blog post";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        await ctx.UpsertContentAsync(
            ContentMigrationContext.FernandoPortfolioId,
            "blog-post",
            "fluentui-dynamic-datagrid",
            new
            {
                slug = "fluentui-dynamic-datagrid",
                title = "Building a Dynamic Data Grid with FluentUI 8",
                excerpt = "Create a fully-featured data grid with sorting, filtering, pagination, inline editing, column resizing, row grouping, and CSV export - all with React and TypeScript.",
                category = "Frontend",
                tags = new[] { "React", "FluentUI", "TypeScript", "Data Grid", "UI/UX", "Enterprise" },
                featuredImage = new
                {
                    url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                    alt = "Data dashboard visualization representing data grid functionality"
                },
                demoComponent = "fluentui-datagrid",
                mdxFile = "/content/blog/fluentui-dynamic-datagrid.md",
                readTime = "15 min read",
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
            "fluentui-dynamic-datagrid");

        await ctx.SaveChangesAsync();
    }
}
