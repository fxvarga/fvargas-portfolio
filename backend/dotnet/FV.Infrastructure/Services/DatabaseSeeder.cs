using System.Text.Json;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using FV.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace FV.Infrastructure.Services;

public interface IDatabaseSeeder
{
    Task SeedAsync();
}

public class DatabaseSeeder : IDatabaseSeeder
{
    private readonly CmsDbContext _context;
    private readonly IAuthService _authService;

    public DatabaseSeeder(CmsDbContext context, IAuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    public async Task SeedAsync()
    {
        // Seed admin user if not exists
        if (!await _context.Users.AnyAsync())
        {
            await _authService.CreateUserAsync("admin", "admin123", "Admin");
        }

        // Seed content if not exists
        if (!await _context.EntityRecords.AnyAsync())
        {
            await SeedPortfolioContentAsync();
        }
    }

    private async Task SeedPortfolioContentAsync()
    {
        var now = DateTime.UtcNow;

        // Site Config
        await CreateContentAsync("site-config", new
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
        await CreateContentAsync("hero", new
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
        await CreateContentAsync("about", new
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
        await CreateContentAsync("services", new
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
                    technologies = new[] { "OpenAI GPT-4 & Assistants API", "LangChain for orchestration", "Azure Functions / AWS Lambda", "Node.js & Python microservices", "Vector databases (Pinecone / Weaviate)" },
                    approach = new[]
                    {
                        new { title = "Prompt Engineering", content = "Designed modular prompt templates that convert user-provided documents into structured JSON workflows." },
                        new { title = "Semantic Step Extraction", content = "Used embeddings and similarity scoring to decompose instructions into discrete, reorderable steps." },
                        new { title = "Execution Mapping", content = "Mapped each extracted step to backend services using a registry-based architecture." },
                        new { title = "Feedback Loops", content = "Built human-in-the-loop checkpoints to verify high-stakes decisions before continuing execution." }
                    },
                    cta = new { title = "Have project in mind? Let's discuss", description = "Get in touch with us to see how we can help you with your project" }
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
                    technologies = new[] { "React + Module Federation (Webpack 5)", "TypeScript", "Redux Toolkit", "OAuth 2.0 / OpenID Connect", "REST & GraphQL APIs", "D3.js / Recharts" },
                    approach = new[]
                    {
                        new { title = "Micro-Frontend Architecture", content = "Adopted Webpack Module Federation to allow independent deployment of dashboard widgets." },
                        new { title = "Unified Auth & RBAC", content = "Implemented a centralized identity layer with role-based access control." },
                        new { title = "Cross-System Filtering", content = "Built a shared filter context that propagated user-selected parameters across all dashboard components." }
                    },
                    cta = new { title = "Have project in mind? Let's discuss", description = "Get in touch with us to see how we can help you with your project" }
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
                    technologies = new[] { "React + Next.js", "Node.js + Express backend", "MongoDB with dynamic schemas", "GraphQL API", "AWS S3 + CloudFront", "Redis caching" },
                    approach = new[]
                    {
                        new { title = "Schema-Driven Content Modeling", content = "Developed a dynamic schema engine using JSON Schema under the hood." },
                        new { title = "Reusable Template System", content = "Built a library of composable templates and components for consistent branding." },
                        new { title = "Drag-and-Drop Editor", content = "Integrated a visual layout builder for content authors." }
                    },
                    cta = new { title = "Have project in mind? Let's discuss", description = "Get in touch with us to see how we can help you with your project" }
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
                    technologies = new[] { "Elasticsearch 8.x", "Node.js ingestion service", "React + TypeScript frontend", "AWS OpenSearch", "Kibana for analytics", "Redis caching" },
                    approach = new[]
                    {
                        new { title = "Fuzzy & Phonetic Matching", content = "Configured Elasticsearch analyzers with fuzzy matching, stemming, and phonetic plugins." },
                        new { title = "Faceted Filtering", content = "Implemented aggregation-based facets for drill-down filtering." },
                        new { title = "Autocomplete & Suggestions", content = "Built a debounced autocomplete component that queries an optimized suggester index." }
                    },
                    cta = new { title = "Have project in mind? Let's discuss", description = "Get in touch with us to see how we can help you with your project" }
                }
            }
        });

        // Contact Section
        await CreateContentAsync("contact", new
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
        await CreateContentAsync("navigation", new
        {
            logo = new
            {
                url = "/assets/images/logo.png",
                alt = "Logo"
            },
            menuItems = new[]
            {
                new { id = 1, title = "Home", link = "hero" },
                new { id = 2, title = "About", link = "about" },
                new { id = 3, title = "Featured Work", link = "service" },
                new { id = 4, title = "Contact", link = "contact" }
            },
            searchPlaceholder = "Search here...",
            devModeLabel = "INSIGHTS MODE ON",
            insightsLabel = "Insights"
        });

        // Footer
        await CreateContentAsync("footer", new
        {
            logo = new
            {
                url = "/assets/images/logo.png",
                alt = "Logo"
            }
        });

        await _context.SaveChangesAsync();
    }

    private Task CreateContentAsync<T>(string entityType, T data)
    {
        var record = new EntityRecord
        {
            Id = Guid.NewGuid(),
            EntityType = entityType,
            JsonData = JsonSerializer.Serialize(data),
            IsDraft = false,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1
        };
        _context.EntityRecords.Add(record);
        return Task.CompletedTask;
    }
}
