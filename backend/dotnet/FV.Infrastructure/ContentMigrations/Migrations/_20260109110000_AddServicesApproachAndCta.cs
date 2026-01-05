namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Updates the services content to include approach steps, CTA, and slugs for work detail pages.
/// </summary>
public class _20260109110000_AddServicesApproachAndCta : ContentMigration
{
    public override string Description => "Add approach, cta, and slug fields to services for work detail pages";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

        // Services Section with full detail page data
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
                    slug = "ai-workflow-orchestration",
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
                        new { title = "Prompt Engineering", content = "Designed modular prompt templates that convert unstructured instructions into structured JSON workflows with defined steps, conditions, and outputs." },
                        new { title = "Semantic Step Extraction", content = "Used embeddings to decompose complex instructions into discrete, executable steps with proper sequencing and dependency handling." },
                        new { title = "Orchestration Layer", content = "Built a robust orchestration engine using LangChain to manage step execution, error handling, and state persistence across distributed systems." }
                    },
                    cta = new { title = "Have a project in mind?", description = "Let's discuss how AI orchestration can streamline your business processes." }
                },
                new
                {
                    id = "2",
                    slug = "financial-dashboard-applications",
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
                        new { title = "Micro-Frontend Architecture", content = "Adopted Webpack Module Federation to enable independent deployment of dashboard modules while maintaining a cohesive user experience." },
                        new { title = "Unified Auth & RBAC", content = "Implemented a centralized identity layer with role-based access control to secure sensitive financial data across all integrated systems." },
                        new { title = "Real-time Data Visualization", content = "Built interactive charts and dashboards using D3.js and Recharts with WebSocket connections for live data updates." }
                    },
                    cta = new { title = "Have a project in mind?", description = "Let's discuss how a unified dashboard can transform your data visibility." }
                },
                new
                {
                    id = "3",
                    slug = "content-management-systems",
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
                        new { title = "Schema-Driven Content", content = "Built a dynamic schema engine using JSON Schema that allows content administrators to define new content types without code changes." },
                        new { title = "Drag-and-Drop Editor", content = "Created a visual layout builder enabling content authors to compose pages using reusable components with real-time preview." },
                        new { title = "Multi-Tenant Architecture", content = "Designed isolated data storage and customizable theming to support multiple brands from a single platform instance." }
                    },
                    cta = new { title = "Have a project in mind?", description = "Let's discuss how a custom CMS can empower your content team." }
                },
                new
                {
                    id = "4",
                    slug = "elastic-search-platform",
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
                        new { title = "Fuzzy Matching", content = "Configured custom analyzers with fuzzy matching, stemming, and synonym support to handle typos and natural language variations." },
                        new { title = "Faceted Filtering", content = "Built aggregation-based facets for drill-down filtering by category, date range, location, and custom attributes." },
                        new { title = "Performance Optimization", content = "Implemented Redis caching for frequent queries and optimized index mappings to achieve sub-100ms response times at scale." }
                    },
                    cta = new { title = "Have a project in mind?", description = "Let's discuss how powerful search can improve your user experience." }
                }
            }
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        // Revert to original services without approach/cta/slug
        var portfolioId = ContentMigrationContext.FernandoPortfolioId;

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

        await ctx.SaveChangesAsync();
    }
}
