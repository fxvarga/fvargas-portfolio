namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions and content for Busybee portfolio.
/// </summary>
public class _20260101000005_BusybeePortfolio : ContentMigration
{
    public override string Description => "Create entity definitions and content for Busybee portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.BusybeePortfolioId;

        // Entity Definitions
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "site-config", def => def
            .DisplayName("Site Configuration").Description("Global site settings").Icon("settings").Category("Settings").IsSingleton(true)
            .AddAttribute(a => a.Name("companyName").Type("string").Required().Label("Company Name"))
            .AddAttribute(a => a.Name("tagline").Type("string").Label("Tagline"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Contact Email"))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Phone")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "hero", def => def
            .DisplayName("Hero Section").Description("Main hero banner").Icon("star").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("headline").Type("string").Required().Label("Headline"))
            .AddAttribute(a => a.Name("subheadline").Type("text").Label("Subheadline"))
            .AddAttribute(a => a.Name("primaryCtaText").Type("string").Label("Primary CTA Text"))
            .AddAttribute(a => a.Name("primaryCtaLink").Type("string").Label("Primary CTA Link"))
            .AddAttribute(a => a.Name("secondaryCtaText").Type("string").Label("Secondary CTA Text"))
            .AddAttribute(a => a.Name("secondaryCtaLink").Type("string").Label("Secondary CTA Link")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "stats", def => def
            .DisplayName("Statistics").Description("Company statistics and achievements").Icon("trending_up").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("stats").Type("array").Required().Label("Statistics")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "services", def => def
            .DisplayName("Services").Description("Marketing services offered").Icon("work").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Section Title"))
            .AddAttribute(a => a.Name("subtitle").Type("string").Label("Subtitle"))
            .AddAttribute(a => a.Name("services").Type("array").Required().Label("Services")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "about", def => def
            .DisplayName("About Section").Description("About the company").Icon("info").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Section Title"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("features").Type("array").Label("Features")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "testimonials", def => def
            .DisplayName("Testimonials").Description("Client testimonials").Icon("format_quote").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Section Title"))
            .AddAttribute(a => a.Name("subtitle").Type("string").Label("Subtitle"))
            .AddAttribute(a => a.Name("testimonials").Type("array").Required().Label("Testimonials")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "contact", def => def
            .DisplayName("Contact Section").Description("Contact form and information").Icon("mail").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Section Title"))
            .AddAttribute(a => a.Name("subtitle").Type("string").Label("Subtitle"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Email"))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Phone")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "navigation", def => def
            .DisplayName("Navigation").Description("Site navigation and header settings").Icon("menu").Category("Layout").IsSingleton(true)
            .AddAttribute(a => a.Name("logoIcon").Type("string").Label("Logo Icon"))
            .AddAttribute(a => a.Name("logoText").Type("string").Required().Label("Logo Text"))
            .AddAttribute(a => a.Name("links").Type("array").Required().Label("Navigation Links"))
            .AddAttribute(a => a.Name("ctaText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaLink").Type("string").Label("CTA Button Link")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "footer", def => def
            .DisplayName("Footer").Description("Site footer settings").Icon("bottom_navigation").Category("Layout").IsSingleton(true)
            .AddAttribute(a => a.Name("logoIcon").Type("string").Label("Logo Icon"))
            .AddAttribute(a => a.Name("logoText").Type("string").Required().Label("Logo Text"))
            .AddAttribute(a => a.Name("tagline").Type("string").Label("Tagline"))
            .AddAttribute(a => a.Name("serviceLinks").Type("array").Label("Service Links"))
            .AddAttribute(a => a.Name("companyLinks").Type("array").Label("Company Links"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Contact Email"))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Contact Phone"))
            .AddAttribute(a => a.Name("socialLinks").Type("array").Label("Social Links"))
            .AddAttribute(a => a.Name("copyright").Type("string").Label("Copyright Text")));

        await ctx.SaveChangesAsync();

        // Content - Site Config
        await ctx.UpsertContentAsync(portfolioId, "site-config", "default", new
        {
            companyName = "The Busy Bee",
            tagline = "Digital Marketing That Creates Buzz",
            email = "hello@thebusybeeweb.com",
            phone = "(555) 123-4567"
        });

        // Hero
        await ctx.UpsertContentAsync(portfolioId, "hero", "default", new
        {
            headline = "We Make Your Brand Buzz",
            subheadline = "Award-winning digital marketing that drives real results. We're the hive mind behind some of the most successful campaigns in the industry.",
            primaryCtaText = "Start Your Journey",
            primaryCtaLink = "#contact",
            secondaryCtaText = "Explore Services",
            secondaryCtaLink = "#services"
        });

        // Stats
        await ctx.UpsertContentAsync(portfolioId, "stats", "default", new
        {
            stats = new[]
            {
                new { value = "250+", label = "Happy Clients" },
                new { value = "500%", label = "Avg. ROI" },
                new { value = "10M+", label = "Leads Generated" },
                new { value = "15+", label = "Years Experience" }
            }
        });

        // Services
        await ctx.UpsertContentAsync(portfolioId, "services", "default", new
        {
            title = "Our Hive of Services",
            subtitle = "Everything you need to grow your digital presence, all under one roof.",
            services = new[]
            {
                new { icon = "🎯", title = "Digital Strategy", description = "Data-driven strategies that put your brand in front of the right audience at the right time." },
                new { icon = "📱", title = "Social Media", description = "Engaging content and community management that builds loyal followers and brand advocates." },
                new { icon = "🔍", title = "SEO & SEM", description = "Dominate search results and drive qualified traffic with our proven optimization techniques." },
                new { icon = "✨", title = "Brand Identity", description = "Memorable branding that captures your essence and resonates with your target market." },
                new { icon = "📧", title = "Email Marketing", description = "Personalized campaigns that nurture leads and keep your customers coming back for more." },
                new { icon = "📊", title = "Analytics", description = "Deep insights and reporting that turn data into actionable growth opportunities." }
            }
        });

        // About
        await ctx.UpsertContentAsync(portfolioId, "about", "default", new
        {
            title = "Why Choose The Busy Bee?",
            description = "We're not just another marketing agency. We're a collective of passionate strategists, creatives, and data nerds who live and breathe digital marketing.",
            features = new[]
            {
                new { text = "Results-focused approach with transparent reporting" },
                new { text = "Dedicated team assigned to your account" },
                new { text = "Cutting-edge tools and proven methodologies" },
                new { text = "Flexible packages tailored to your goals" }
            }
        });

        // Testimonials
        await ctx.UpsertContentAsync(portfolioId, "testimonials", "default", new
        {
            title = "What Our Clients Say",
            subtitle = "Don't just take our word for it - hear from the brands we've helped grow.",
            testimonials = new[]
            {
                new { quote = "The Busy Bee transformed our online presence. Our leads increased by 300% in just 3 months!", author = "Sarah Chen", role = "CEO, TechStart Inc." },
                new { quote = "Their creative approach and data-driven strategies helped us stand out in a crowded market.", author = "Marcus Johnson", role = "Marketing Director, GrowthCo" },
                new { quote = "Professional, responsive, and results-oriented. The best marketing decision we ever made.", author = "Emily Rodriguez", role = "Founder, Bloom Boutique" }
            }
        });

        // Contact
        await ctx.UpsertContentAsync(portfolioId, "contact", "default", new
        {
            title = "Ready to Make Some Buzz?",
            subtitle = "Let's discuss how we can help your brand reach new heights. Schedule a free consultation today.",
            email = "hello@thebusybeeweb.com",
            phone = "(555) 123-4567"
        });

        // Navigation
        await ctx.UpsertContentAsync(portfolioId, "navigation", "default", new
        {
            logoIcon = "🐝",
            logoText = "The Busy Bee",
            links = new[]
            {
                new { label = "Services", href = "#services" },
                new { label = "About", href = "#about" },
                new { label = "Results", href = "#results" },
                new { label = "Testimonials", href = "#testimonials" }
            },
            ctaText = "Get Started",
            ctaLink = "#contact"
        });

        // Footer
        await ctx.UpsertContentAsync(portfolioId, "footer", "default", new
        {
            logoIcon = "🐝",
            logoText = "The Busy Bee",
            tagline = "Creating buzz-worthy digital experiences since 2010.",
            serviceLinks = new[]
            {
                new { label = "Digital Strategy", href = "#" },
                new { label = "Social Media", href = "#" },
                new { label = "SEO & SEM", href = "#" },
                new { label = "Brand Identity", href = "#" }
            },
            companyLinks = new[]
            {
                new { label = "About Us", href = "#" },
                new { label = "Careers", href = "#" },
                new { label = "Blog", href = "#" },
                new { label = "Contact", href = "#" }
            },
            email = "hello@thebusybeeweb.com",
            phone = "(555) 123-4567",
            socialLinks = new[]
            {
                new { platform = "Twitter", icon = "𝕏", href = "#" },
                new { platform = "LinkedIn", icon = "in", href = "#" },
                new { platform = "Instagram", icon = "📷", href = "#" }
            },
            copyright = "The Busy Bee. All rights reserved."
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.BusybeePortfolioId;

        // Delete content first
        await ctx.DeleteContentAsync(portfolioId, "footer", "default");
        await ctx.DeleteContentAsync(portfolioId, "navigation", "default");
        await ctx.DeleteContentAsync(portfolioId, "contact", "default");
        await ctx.DeleteContentAsync(portfolioId, "testimonials", "default");
        await ctx.DeleteContentAsync(portfolioId, "about", "default");
        await ctx.DeleteContentAsync(portfolioId, "services", "default");
        await ctx.DeleteContentAsync(portfolioId, "stats", "default");
        await ctx.DeleteContentAsync(portfolioId, "hero", "default");
        await ctx.DeleteContentAsync(portfolioId, "site-config", "default");

        // Then delete definitions
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "footer");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "navigation");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "contact");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "testimonials");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "about");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "services");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "stats");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "hero");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "site-config");

        await ctx.SaveChangesAsync();
    }
}
