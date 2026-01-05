namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Seeds initial content for Fernando's portfolio including site config, hero, about, services, etc.
/// </summary>
public class _20260101000002_FernandoContent : ContentMigration
{
    public override string Description => "Create initial content for Fernando portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

        // Site Config
        await ctx.UpsertContentAsync(portfolioId, "site-config", "default", new
        {
            owner = new
            {
                name = "Fernando Vargas",
                title = "Senior Full-Stack Engineer",
                tagline = "Full-Stack Engineer with Passion for UX"
            },
            contact = new
            {
                phone = "(980)-219-0610",
                email = "fxvarga@gmail.com",
                formEndpoint = "https://formspree.io/f/xjkyeqzq"
            },
            socialLinks = new[]
            {
                new
                {
                    platform = "LinkedIn",
                    url = "https://www.linkedin.com/in/fernando-vargas-16234254/",
                    icon = "ti-linkedin"
                }
            },
            copyright = "© 2025. All rights reserved by Fernando Vargas."
        });

        // Hero Section
        await ctx.UpsertContentAsync(portfolioId, "hero", "default", new
        {
            title = "Senior Full-Stack Engineer",
            name = "Fernando Vargas",
            backgroundText = "Developer",
            image = new
            {
                url = "/assets/images/slider/fernando-portfolio-hero.png",
                alt = "Fernando Vargas portrait"
            },
            ctaButton = new
            {
                label = "Contact Me",
                scrollTo = "contact"
            },
            insightsDialog = new
            {
                title = "AI Image Remix",
                description = "Click the button below to generate a unique AI-powered variation of this hero image. Each generation creates a different artistic interpretation.",
                prompt = "Generate a creative remix of this portfolio hero image"
            }
        });

        // About Section
        await ctx.UpsertContentAsync(portfolioId, "about", "default", new
        {
            greeting = "Hi I'm Fernando Vargas",
            headline = "Full-Stack Engineer with Passion for UX",
            subheadline = "Over 12 years of experience developing innovative, user-focused applications across finance, healthcare, and content-driven domains.",
            bio = "From responsive front-ends and scalable cloud systems to AI-enhanced tooling, my work has spanned diverse industries with a consistent focus on practical solutions and quality user experiences. I bring an architect's perspective and a builder's mindset to every project, guiding teams and aligning technical strategy with real business goals.",
            experienceYears = "12+",
            sectionTitle = "About Me",
            image = new
            {
                url = "/assets/images/about/fernando-portfolio-image.png",
                alt = "Fernando Vargas"
            },
            insightsDialog = new
            {
                title = "AI Career Insights",
                description = "In twelve years of experience across various industries, I've worked on AI orchestration, financial dashboards, CMS platforms, and more. Ask me anything about my career journey!"
            }
        });

        // Services Section
        await ctx.UpsertContentAsync(portfolioId, "services", "default", new
        {
            label = "Enterprise Work",
            title = "My featured projects",
            backgroundText = "Services",
            services = new[]
            {
                new
                {
                    id = "1",
                    title = "AI Workflow Orchestration",
                    description = "Built an AI-driven orchestration system that transformed natural-language process documents into executable workflows, solving the challenge of bridging human input and automated systems.",
                    icon = "flaticon-vector",
                    image = new
                    {
                        url = "/assets/images/service-single/web/ai-orchestration-minimal.png",
                        alt = "AI Workflow Orchestration"
                    },
                    dialogTitle = "AI Workflow",
                    leadIn = "I architected an AI-powered orchestration layer using OpenAI APIs and custom integrations to transform how teams interact with structured business processes.",
                    technologies = new[] { "OpenAI GPT-4 & Assistants API", "LangChain for orchestration", "Azure Functions / AWS Lambda", "Node.js & Python microservices", "Vector databases (Pinecone / Weaviate)" }
                },
                new
                {
                    id = "2",
                    title = "Financial Dashboard Applications",
                    description = "Designed a micro-frontend dashboard platform to unify financial data across five siloed systems.",
                    icon = "flaticon-smartphone",
                    image = new
                    {
                        url = "/assets/images/service-single/web/fin-tech-minimal.png",
                        alt = "Financial Dashboard Applications"
                    },
                    dialogTitle = "Financial Dashboard Applications",
                    leadIn = "I led the architecture and development of a modular financial dashboard platform designed to consolidate critical data from five previously siloed internal systems.",
                    technologies = new[] { "React + Module Federation (Webpack 5)", "TypeScript", "Redux Toolkit", "OAuth 2.0 / OpenID Connect", "REST & GraphQL APIs", "D3.js / Recharts" }
                },
                new
                {
                    id = "3",
                    title = "Content Management Systems",
                    description = "Engineered a dynamic, schema-driven CMS supporting reusable templates and drag-and-drop dashboards.",
                    icon = "flaticon-palette",
                    image = new
                    {
                        url = "/assets/images/service-single/web/cms-minimal.png",
                        alt = "Content Management Systems"
                    },
                    dialogTitle = "Content Management Systems",
                    leadIn = "I designed and built a flexible, schema-driven content management system tailored for multi-tenant environments.",
                    technologies = new[] { "React + Next.js", "Node.js + Express backend", "MongoDB with dynamic schemas", "GraphQL API", "AWS S3 + CloudFront", "Redis caching" }
                },
                new
                {
                    id = "4",
                    title = "Elastic Search Platform",
                    description = "Developed a fuzzy search engine using Elasticsearch and modular UI components.",
                    icon = "flaticon-bar-chart",
                    image = new
                    {
                        url = "/assets/images/service-single/web/elastic-search-minimal.png",
                        alt = "Elastic Search Platform"
                    },
                    dialogTitle = "Elastic Search Platform",
                    leadIn = "I developed a high-performance search platform using Elasticsearch to power fast, typo-tolerant queries across thousands of events, venues, and content items.",
                    technologies = new[] { "Elasticsearch 8.x", "Node.js ingestion service", "React + TypeScript frontend", "AWS OpenSearch", "Kibana for analytics", "Redis caching" }
                }
            }
        });

        // Contact Section
        await ctx.UpsertContentAsync(portfolioId, "contact", "default", new
        {
            title = "Send me a Message",
            description = "Your email address will not be published. Required fields are marked *",
            backgroundText = "Contact Me",
            successMessage = "Message sent!",
            errorMessage = "Failed to send message. Please try again.",
            submitButtonText = "Submit now",
            formFields = new
            {
                name = new { label = "Name*", placeholder = "Your Name" },
                email = new { label = "Email*", placeholder = "Your Email" },
                message = new { label = "Message*", placeholder = "Message" }
            }
        });

        // Navigation
        await ctx.UpsertContentAsync(portfolioId, "navigation", "default", new
        {
            logo = new
            {
                url = "/assets/images/logo.png",
                alt = "Logo"
            },
            menuItems = new[]
            {
                new { id = 1, title = "Home", link = "home" },
                new { id = 2, title = "About", link = "about" },
                new { id = 3, title = "Featured Work", link = "featured-work" },
                new { id = 4, title = "Contact", link = "contact" }
            },
            searchPlaceholder = "Search here...",
            devModeLabel = "INSIGHTS MODE ON",
            insightsLabel = "Insights"
        });

        // Footer
        await ctx.UpsertContentAsync(portfolioId, "footer", "default", new
        {
            logo = new
            {
                url = "/assets/images/logo.png",
                alt = "Logo"
            }
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

        await ctx.DeleteContentAsync(portfolioId, "footer", "default");
        await ctx.DeleteContentAsync(portfolioId, "navigation", "default");
        await ctx.DeleteContentAsync(portfolioId, "contact", "default");
        await ctx.DeleteContentAsync(portfolioId, "services", "default");
        await ctx.DeleteContentAsync(portfolioId, "about", "default");
        await ctx.DeleteContentAsync(portfolioId, "hero", "default");
        await ctx.DeleteContentAsync(portfolioId, "site-config", "default");

        await ctx.SaveChangesAsync();
    }
}
