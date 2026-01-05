namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions (content types/schemas) for Fernando's portfolio.
/// These define the structure of content like site-config, hero, about, services, etc.
/// </summary>
public class _20260101000001_FernandoEntityDefinitions : ContentMigration
{
    public override string Description => "Create entity definitions for Fernando portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

        // Site Config Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "site-config", def => def
            .DisplayName("Site Configuration")
            .Description("Global site settings including owner info, contact details, and social links")
            .Icon("settings")
            .Category("Settings")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("owner").Type("object").Required().Label("Owner")
                .Children(c => c
                    .Add(a => a.Name("name").Type("string").Required().Label("Name"))
                    .Add(a => a.Name("title").Type("string").Required().Label("Title"))
                    .Add(a => a.Name("tagline").Type("string").Label("Tagline"))))
            .AddAttribute(a => a.Name("contact").Type("object").Required().Label("Contact")
                .Children(c => c
                    .Add(a => a.Name("phone").Type("string").Label("Phone"))
                    .Add(a => a.Name("email").Type("string").Required().Label("Email"))
                    .Add(a => a.Name("formEndpoint").Type("string").Label("Form Endpoint URL"))))
            .AddAttribute(a => a.Name("socialLinks").Type("array").Label("Social Links")
                .Children(c => c
                    .Add(a => a.Name("platform").Type("string").Required().Label("Platform"))
                    .Add(a => a.Name("url").Type("string").Required().Label("URL"))
                    .Add(a => a.Name("icon").Type("string").Label("Icon Class"))))
            .AddAttribute(a => a.Name("copyright").Type("string").Label("Copyright Text")));

        // Hero Section Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "hero", def => def
            .DisplayName("Hero Section")
            .Description("Main hero/banner section of the portfolio")
            .Icon("star")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Title"))
            .AddAttribute(a => a.Name("name").Type("string").Required().Label("Name"))
            .AddAttribute(a => a.Name("backgroundText").Type("string").Label("Background Text"))
            .AddAttribute(a => a.Name("image").Type("object").Label("Image")
                .Children(c => c
                    .Add(a => a.Name("url").Type("string").Required().Label("URL"))
                    .Add(a => a.Name("alt").Type("string").Label("Alt Text"))))
            .AddAttribute(a => a.Name("ctaButton").Type("object").Label("CTA Button")
                .Children(c => c
                    .Add(a => a.Name("label").Type("string").Required().Label("Label"))
                    .Add(a => a.Name("scrollTo").Type("string").Label("Scroll To Section"))))
            .AddAttribute(a => a.Name("insightsDialog").Type("object").Label("Insights Dialog")
                .Children(c => c
                    .Add(a => a.Name("title").Type("string").Label("Title"))
                    .Add(a => a.Name("description").Type("text").Label("Description"))
                    .Add(a => a.Name("prompt").Type("text").Label("AI Prompt")))));

        // About Section Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "about", def => def
            .DisplayName("About Section")
            .Description("About me section with bio and experience details")
            .Icon("person")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("greeting").Type("string").Label("Greeting"))
            .AddAttribute(a => a.Name("headline").Type("string").Required().Label("Headline"))
            .AddAttribute(a => a.Name("subheadline").Type("text").Label("Subheadline"))
            .AddAttribute(a => a.Name("bio").Type("text").Required().Label("Bio"))
            .AddAttribute(a => a.Name("experienceYears").Type("string").Label("Years of Experience"))
            .AddAttribute(a => a.Name("sectionTitle").Type("string").Label("Section Title"))
            .AddAttribute(a => a.Name("image").Type("object").Label("Image")
                .Children(c => c
                    .Add(a => a.Name("url").Type("string").Required().Label("URL"))
                    .Add(a => a.Name("alt").Type("string").Label("Alt Text"))))
            .AddAttribute(a => a.Name("insightsDialog").Type("object").Label("Insights Dialog")
                .Children(c => c
                    .Add(a => a.Name("title").Type("string").Label("Title"))
                    .Add(a => a.Name("description").Type("text").Label("Description")))));

        // Services Section Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "services", def => def
            .DisplayName("Services")
            .Description("Featured projects and services section")
            .Icon("work")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("label").Type("string").Label("Label"))
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Title"))
            .AddAttribute(a => a.Name("backgroundText").Type("string").Label("Background Text"))
            .AddAttribute(a => a.Name("services").Type("array").Required().Label("Services")
                .Children(c => c
                    .Add(a => a.Name("id").Type("string").Required().Label("ID"))
                    .Add(a => a.Name("title").Type("string").Required().Label("Title"))
                    .Add(a => a.Name("description").Type("text").Required().Label("Description"))
                    .Add(a => a.Name("icon").Type("string").Label("Icon"))
                    .Add(a => a.Name("dialogTitle").Type("string").Label("Dialog Title"))
                    .Add(a => a.Name("leadIn").Type("text").Label("Lead In Text"))
                    .Add(a => a.Name("technologies").Type("tags").Label("Technologies")))));

        // Contact Section Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "contact", def => def
            .DisplayName("Contact")
            .Description("Contact form section")
            .Icon("mail")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Title"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("backgroundText").Type("string").Label("Background Text"))
            .AddAttribute(a => a.Name("successMessage").Type("string").Label("Success Message"))
            .AddAttribute(a => a.Name("errorMessage").Type("string").Label("Error Message"))
            .AddAttribute(a => a.Name("submitButtonText").Type("string").Label("Submit Button Text")));

        // Navigation Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "navigation", def => def
            .DisplayName("Navigation")
            .Description("Site navigation and header settings")
            .Icon("menu")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("logo").Type("object").Label("Logo")
                .Children(c => c
                    .Add(a => a.Name("url").Type("string").Required().Label("URL"))
                    .Add(a => a.Name("alt").Type("string").Label("Alt Text"))))
            .AddAttribute(a => a.Name("menuItems").Type("array").Required().Label("Menu Items")
                .Children(c => c
                    .Add(a => a.Name("id").Type("number").Required().Label("ID"))
                    .Add(a => a.Name("title").Type("string").Required().Label("Title"))
                    .Add(a => a.Name("link").Type("string").Required().Label("Link"))))
            .AddAttribute(a => a.Name("searchPlaceholder").Type("string").Label("Search Placeholder"))
            .AddAttribute(a => a.Name("devModeLabel").Type("string").Label("Dev Mode Label"))
            .AddAttribute(a => a.Name("insightsLabel").Type("string").Label("Insights Label")));

        // Footer Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "footer", def => def
            .DisplayName("Footer")
            .Description("Site footer settings")
            .Icon("bottom_navigation")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("logo").Type("object").Label("Logo")
                .Children(c => c
                    .Add(a => a.Name("url").Type("string").Required().Label("URL"))
                    .Add(a => a.Name("alt").Type("string").Label("Alt Text")))));

        // Blog Post Definition
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "blog-post", def => def
            .DisplayName("Blog Post")
            .Description("Technical blog posts with interactive demos")
            .Icon("article")
            .Category("Content")
            .IsCollection()
            .AddAttribute(a => a.Name("slug").Type("string").Required().Label("URL Slug"))
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Title"))
            .AddAttribute(a => a.Name("excerpt").Type("text").Required().Label("Excerpt"))
            .AddAttribute(a => a.Name("category").Type("string").Label("Category"))
            .AddAttribute(a => a.Name("tags").Type("tags").Label("Tags"))
            .AddAttribute(a => a.Name("featuredImage").Type("object").Label("Featured Image")
                .Children(c => c
                    .Add(a => a.Name("url").Type("string").Label("URL"))
                    .Add(a => a.Name("alt").Type("string").Label("Alt Text"))))
            .AddAttribute(a => a.Name("demoComponent").Type("string").Label("Demo Component Name"))
            .AddAttribute(a => a.Name("mdxFile").Type("string").Label("MDX File Path"))
            .AddAttribute(a => a.Name("readTime").Type("string").Label("Read Time"))
            .AddAttribute(a => a.Name("publishedDate").Type("string").Required().Label("Published Date"))
            .AddAttribute(a => a.Name("isPublished").Type("boolean").Label("Is Published")));

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

        await ctx.DeleteEntityDefinitionAsync(portfolioId, "blog-post");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "footer");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "navigation");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "contact");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "services");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "about");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "hero");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "site-config");

        await ctx.SaveChangesAsync();
    }
}
