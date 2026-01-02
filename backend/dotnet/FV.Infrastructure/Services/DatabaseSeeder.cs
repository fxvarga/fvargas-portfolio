using System.Text.Json;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
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

    // Well-known portfolio IDs for consistent seeding
    public static readonly Guid FernandoPortfolioId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid JessicaPortfolioId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid BusybeePortfolioId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    public DatabaseSeeder(CmsDbContext context, IAuthService authService)
    {
        _context = context;
        _authService = authService;
    }

    public async Task SeedAsync()
    {
        // Seed portfolios first (required for FK constraints)
        await SeedPortfoliosAsync();
        
        // Seed admin user if not exists
        CmsUser? adminUser = null;
        if (!await _context.Users.AnyAsync())
        {
            adminUser = await _authService.CreateUserAsync("admin", "admin123", "Admin");
        }
        else
        {
            adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        }

        // Assign admin to all portfolios
        if (adminUser != null)
        {
            await AssignUserToAllPortfoliosAsync(adminUser.Id);
        }

        // Seed entity definitions (content types) if not exists for Fernando portfolio
        if (!await _context.EntityDefinitions.AnyAsync(e => e.PortfolioId == FernandoPortfolioId))
        {
            await SeedEntityDefinitionsAsync(FernandoPortfolioId);
        }

        // Seed content if not exists for Fernando portfolio
        if (!await _context.EntityRecords.AnyAsync(e => e.PortfolioId == FernandoPortfolioId))
        {
            await SeedPortfolioContentAsync(FernandoPortfolioId);
        }

        // Seed entity definitions for Jessica portfolio
        if (!await _context.EntityDefinitions.AnyAsync(e => e.PortfolioId == JessicaPortfolioId))
        {
            await SeedJessicaEntityDefinitionsAsync();
        }

        // Seed content for Jessica portfolio
        if (!await _context.EntityRecords.AnyAsync(e => e.PortfolioId == JessicaPortfolioId))
        {
            await SeedJessicaContentAsync();
        }

        // Seed entity definitions for Busybee portfolio
        if (!await _context.EntityDefinitions.AnyAsync(e => e.PortfolioId == BusybeePortfolioId))
        {
            await SeedBusybeeEntityDefinitionsAsync();
        }

        // Seed content for Busybee portfolio
        if (!await _context.EntityRecords.AnyAsync(e => e.PortfolioId == BusybeePortfolioId))
        {
            await SeedBusybeeContentAsync();
        }
    }

    private async Task SeedPortfoliosAsync()
    {
        if (await _context.Portfolios.AnyAsync())
        {
            return; // Already seeded
        }

        var portfolios = new List<Portfolio>
        {
            new Portfolio
            {
                Id = FernandoPortfolioId,
                Slug = "fernando",
                Name = "Fernando Vargas Portfolio",
                Domain = "fernando-vargas.com",
                Description = "Senior Full-Stack Engineer portfolio",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Portfolio
            {
                Id = JessicaPortfolioId,
                Slug = "jessica",
                Name = "Jessica Sutherland Portfolio",
                Domain = "jessicasutherland.me",
                Description = "Jessica Sutherland's portfolio",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new Portfolio
            {
                Id = BusybeePortfolioId,
                Slug = "busybee",
                Name = "The Busy Bee Web",
                Domain = "thebusybeeweb.com",
                Description = "The Busy Bee Web portfolio",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        _context.Portfolios.AddRange(portfolios);
        await _context.SaveChangesAsync();
    }

    private async Task AssignUserToAllPortfoliosAsync(Guid userId)
    {
        var portfolioIds = await _context.Portfolios.Select(p => p.Id).ToListAsync();
        
        foreach (var portfolioId in portfolioIds)
        {
            var exists = await _context.UserPortfolios
                .AnyAsync(up => up.UserId == userId && up.PortfolioId == portfolioId);
            
            if (!exists)
            {
                _context.UserPortfolios.Add(new UserPortfolio
                {
                    UserId = userId,
                    PortfolioId = portfolioId,
                    Role = PortfolioRoles.Admin,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
        
        await _context.SaveChangesAsync();
    }

    private async Task SeedEntityDefinitionsAsync(Guid portfolioId)
    {
        var now = DateTime.UtcNow;

        // Site Config Definition
        var siteConfigDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "site-config",
            DisplayName = "Site Configuration",
            Description = "Global site settings including owner info, contact details, and social links",
            Icon = "settings",
            IsSingleton = true,
            Category = "Settings",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "owner", Type = "object", IsRequired = true, Label = "Owner", Order = 1,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "name", Type = "string", IsRequired = true, Label = "Name", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "tagline", Type = "string", Label = "Tagline", Order = 3 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "contact", Type = "object", IsRequired = true, Label = "Contact", Order = 2,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "phone", Type = "string", Label = "Phone", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "email", Type = "string", IsRequired = true, Label = "Email", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "formEndpoint", Type = "string", Label = "Form Endpoint URL", Order = 3 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "socialLinks", Type = "array", Label = "Social Links", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "platform", Type = "string", IsRequired = true, Label = "Platform", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "URL", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "icon", Type = "string", Label = "Icon Class", Order = 3 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "copyright", Type = "string", Label = "Copyright Text", Order = 4 }
            }
        };

        // Hero Section Definition
        var heroDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "hero",
            DisplayName = "Hero Section",
            Description = "Main hero/banner section of the portfolio",
            Icon = "star",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "name", Type = "string", IsRequired = true, Label = "Name", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "backgroundText", Type = "string", Label = "Background Text", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "image", Type = "object", Label = "Image", Order = 4,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "alt", Type = "string", Label = "Alt Text", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "ctaButton", Type = "object", Label = "CTA Button", Order = 5,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "label", Type = "string", IsRequired = true, Label = "Label", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "scrollTo", Type = "string", Label = "Scroll To Section", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "insightsDialog", Type = "object", Label = "Insights Dialog", Order = 6,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", Label = "Title", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "prompt", Type = "text", Label = "AI Prompt", Order = 3 }
                    }
                }
            }
        };

        // About Section Definition
        var aboutDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "about",
            DisplayName = "About Section",
            Description = "About me section with bio and experience details",
            Icon = "person",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "greeting", Type = "string", Label = "Greeting", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "headline", Type = "string", IsRequired = true, Label = "Headline", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "subheadline", Type = "text", Label = "Subheadline", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "bio", Type = "text", IsRequired = true, Label = "Bio", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "experienceYears", Type = "string", Label = "Years of Experience", Order = 5 },
                new() { Id = Guid.NewGuid(), Name = "sectionTitle", Type = "string", Label = "Section Title", Order = 6 },
                new() { Id = Guid.NewGuid(), Name = "image", Type = "object", Label = "Image", Order = 7,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "alt", Type = "string", Label = "Alt Text", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "insightsDialog", Type = "object", Label = "Insights Dialog", Order = 8,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", Label = "Title", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 2 }
                    }
                }
            }
        };

        // Services Section Definition
        var servicesDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "services",
            DisplayName = "Services",
            Description = "Featured projects and services section",
            Icon = "work",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "label", Type = "string", Label = "Label", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "backgroundText", Type = "string", Label = "Background Text", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "services", Type = "array", IsRequired = true, Label = "Services", Order = 4,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "id", Type = "string", IsRequired = true, Label = "ID", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", IsRequired = true, Label = "Description", Order = 3 },
                        new() { Id = Guid.NewGuid(), Name = "icon", Type = "string", Label = "Icon", Order = 4 },
                        new() { Id = Guid.NewGuid(), Name = "image", Type = "object", Label = "Image", Order = 5,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "URL", Order = 1 },
                                new() { Id = Guid.NewGuid(), Name = "alt", Type = "string", Label = "Alt Text", Order = 2 }
                            }
                        },
                        new() { Id = Guid.NewGuid(), Name = "dialogTitle", Type = "string", Label = "Dialog Title", Order = 6 },
                        new() { Id = Guid.NewGuid(), Name = "leadIn", Type = "text", Label = "Lead In Text", Order = 7 },
                        new() { Id = Guid.NewGuid(), Name = "technologies", Type = "tags", Label = "Technologies", Order = 8 },
                        new() { Id = Guid.NewGuid(), Name = "approach", Type = "array", Label = "Approach Steps", Order = 9,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 1 },
                                new() { Id = Guid.NewGuid(), Name = "content", Type = "text", IsRequired = true, Label = "Content", Order = 2 }
                            }
                        },
                        new() { Id = Guid.NewGuid(), Name = "cta", Type = "object", Label = "CTA", Order = 10,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", Label = "Title", Order = 1 },
                                new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 2 }
                            }
                        }
                    }
                }
            }
        };

        // Contact Section Definition
        var contactDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "contact",
            DisplayName = "Contact",
            Description = "Contact form section",
            Icon = "mail",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "backgroundText", Type = "string", Label = "Background Text", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "successMessage", Type = "string", Label = "Success Message", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "errorMessage", Type = "string", Label = "Error Message", Order = 5 },
                new() { Id = Guid.NewGuid(), Name = "submitButtonText", Type = "string", Label = "Submit Button Text", Order = 6 },
                new() { Id = Guid.NewGuid(), Name = "formFields", Type = "object", Label = "Form Fields", Order = 7,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "name", Type = "object", Label = "Name Field", Order = 1,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "label", Type = "string", Label = "Label", Order = 1 },
                                new() { Id = Guid.NewGuid(), Name = "placeholder", Type = "string", Label = "Placeholder", Order = 2 }
                            }
                        },
                        new() { Id = Guid.NewGuid(), Name = "email", Type = "object", Label = "Email Field", Order = 2,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "label", Type = "string", Label = "Label", Order = 1 },
                                new() { Id = Guid.NewGuid(), Name = "placeholder", Type = "string", Label = "Placeholder", Order = 2 }
                            }
                        },
                        new() { Id = Guid.NewGuid(), Name = "message", Type = "object", Label = "Message Field", Order = 3,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "label", Type = "string", Label = "Label", Order = 1 },
                                new() { Id = Guid.NewGuid(), Name = "placeholder", Type = "string", Label = "Placeholder", Order = 2 }
                            }
                        }
                    }
                }
            }
        };

        // Navigation Definition
        var navigationDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "navigation",
            DisplayName = "Navigation",
            Description = "Site navigation and header settings",
            Icon = "menu",
            IsSingleton = true,
            Category = "Layout",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "logo", Type = "object", Label = "Logo", Order = 1,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "alt", Type = "string", Label = "Alt Text", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "menuItems", Type = "array", IsRequired = true, Label = "Menu Items", Order = 2,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "id", Type = "number", IsRequired = true, Label = "ID", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "link", Type = "string", IsRequired = true, Label = "Link", Order = 3 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "searchPlaceholder", Type = "string", Label = "Search Placeholder", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "devModeLabel", Type = "string", Label = "Dev Mode Label", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "insightsLabel", Type = "string", Label = "Insights Label", Order = 5 }
            }
        };

        // Footer Definition
        var footerDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "footer",
            DisplayName = "Footer",
            Description = "Site footer settings",
            Icon = "bottom_navigation",
            IsSingleton = true,
            Category = "Layout",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "logo", Type = "object", Label = "Logo", Order = 1,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "alt", Type = "string", Label = "Alt Text", Order = 2 }
                    }
                }
            }
        };

        _context.EntityDefinitions.AddRange(
            siteConfigDef,
            heroDef,
            aboutDef,
            servicesDef,
            contactDef,
            navigationDef,
            footerDef
        );

        await _context.SaveChangesAsync();
    }

    private async Task SeedPortfolioContentAsync(Guid portfolioId)
    {
        var now = DateTime.UtcNow;

        // Site Config
        await CreateContentAsync(portfolioId, "site-config", new
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
        await CreateContentAsync(portfolioId, "hero", new
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
        await CreateContentAsync(portfolioId, "about", new
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
        await CreateContentAsync(portfolioId, "services", new
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
        await CreateContentAsync(portfolioId, "contact", new
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
        await CreateContentAsync(portfolioId, "navigation", new
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
        await CreateContentAsync(portfolioId, "footer", new
        {
            logo = new
            {
                url = "/assets/images/logo.png",
                alt = "Logo"
            }
        });

        await _context.SaveChangesAsync();
    }

    private Task CreateContentAsync<T>(Guid portfolioId, string entityType, T data)
    {
        var record = new EntityRecord
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
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

    #region Jessica Portfolio Seeding

    private async Task SeedJessicaEntityDefinitionsAsync()
    {
        var now = DateTime.UtcNow;
        var portfolioId = JessicaPortfolioId;

        // Site Config Definition
        var siteConfigDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "site-config",
            DisplayName = "Site Configuration",
            Description = "Global site settings",
            Icon = "settings",
            IsSingleton = true,
            Category = "Settings",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "siteTitle", Type = "string", IsRequired = true, Label = "Site Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "tagline", Type = "string", Label = "Tagline", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "email", Type = "string", Label = "Contact Email", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "phone", Type = "string", Label = "Phone", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "location", Type = "string", Label = "Location", Order = 5 }
            }
        };

        // Hero Section
        var heroDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "hero",
            DisplayName = "Hero Section",
            Description = "Main hero banner",
            Icon = "star",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "greeting", Type = "string", Label = "Greeting", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "name", Type = "string", IsRequired = true, Label = "Name", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "ctaText", Type = "string", Label = "CTA Button Text", Order = 5 },
                new() { Id = Guid.NewGuid(), Name = "ctaLink", Type = "string", Label = "CTA Button Link", Order = 6 }
            }
        };

        // Portfolio/Gallery Section
        var portfolioDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "portfolio",
            DisplayName = "Portfolio Gallery",
            Description = "Photo gallery items",
            Icon = "photo_library",
            IsSingleton = false,
            Category = "Content",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "category", Type = "string", IsRequired = true, Label = "Category", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "imageUrl", Type = "string", IsRequired = true, Label = "Image URL", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "featured", Type = "boolean", Label = "Featured", Order = 5 }
            }
        };

        // About Section
        var aboutDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "about",
            DisplayName = "About Section",
            Description = "About the photographer",
            Icon = "person",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "bio", Type = "text", IsRequired = true, Label = "Biography", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "imageUrl", Type = "string", Label = "Profile Image URL", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "experience", Type = "string", Label = "Years of Experience", Order = 4 }
            }
        };

        // Services Section
        var servicesDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "services",
            DisplayName = "Services",
            Description = "Photography services offered",
            Icon = "camera",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "services", Type = "array", IsRequired = true, Label = "Services", Order = 2,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "name", Type = "string", IsRequired = true, Label = "Service Name", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "price", Type = "string", Label = "Starting Price", Order = 3 }
                    }
                }
            }
        };

        // Contact Section
        var contactDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "contact",
            DisplayName = "Contact Section",
            Description = "Contact information and form settings",
            Icon = "mail",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "subtitle", Type = "string", Label = "Subtitle", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "email", Type = "string", Label = "Email", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "phone", Type = "string", Label = "Phone", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "address", Type = "text", Label = "Address", Order = 5 }
            }
        };

        // Navigation Definition
        var navigationDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "navigation",
            DisplayName = "Navigation",
            Description = "Site navigation and header settings",
            Icon = "menu",
            IsSingleton = true,
            Category = "Layout",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "logoText", Type = "string", IsRequired = true, Label = "Logo Text", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "links", Type = "array", IsRequired = true, Label = "Navigation Links", Order = 2,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "label", Type = "string", IsRequired = true, Label = "Label", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "href", Type = "string", IsRequired = true, Label = "Link", Order = 2 }
                    }
                }
            }
        };

        // Footer Definition
        var footerDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "footer",
            DisplayName = "Footer",
            Description = "Site footer settings",
            Icon = "bottom_navigation",
            IsSingleton = true,
            Category = "Layout",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "copyright", Type = "string", IsRequired = true, Label = "Copyright Text", Order = 1 }
            }
        };

        _context.EntityDefinitions.AddRange(siteConfigDef, heroDef, portfolioDef, aboutDef, servicesDef, contactDef, navigationDef, footerDef);
        await _context.SaveChangesAsync();
    }

    private async Task SeedJessicaContentAsync()
    {
        var portfolioId = JessicaPortfolioId;

        // Navigation
        await CreateContentAsync(portfolioId, "navigation", new
        {
            logoText = "Jessica Sutherland",
            links = new[]
            {
                new { label = "About", href = "#about" },
                new { label = "Portfolio", href = "#portfolio" },
                new { label = "Services", href = "#services" },
                new { label = "Contact", href = "#contact" }
            }
        });

        // Hero - matches exactly what's on the frontend
        await CreateContentAsync(portfolioId, "hero", new
        {
            tagline = "Photographer & Visual Artist",
            name = "Jessica Sutherland",
            subtitle = "Capturing moments that tell your story"
        });

        // About - matches exactly what's on the frontend
        await CreateContentAsync(portfolioId, "about", new
        {
            title = "About Me",
            bio = "I'm a professional photographer based in Austin, Texas, specializing in portrait, lifestyle, and brand photography. With over 8 years of experience, I've had the privilege of working with incredible individuals and brands to create authentic, timeless imagery that resonates."
        });

        // Portfolio - matches exactly what's on the frontend
        await CreateContentAsync(portfolioId, "portfolio", new
        {
            title = "Selected Work",
            items = new[]
            {
                new { title = "Urban Portraits", category = "Portrait" },
                new { title = "Brand Story: Bloom", category = "Commercial" },
                new { title = "Summer Collection", category = "Fashion" },
                new { title = "Family Sessions", category = "Lifestyle" },
                new { title = "Editorial: Vogue", category = "Editorial" },
                new { title = "Product Launch", category = "Commercial" }
            }
        });

        // Services - matches exactly what's on the frontend
        await CreateContentAsync(portfolioId, "services", new
        {
            title = "Services",
            services = new[]
            {
                new { title = "Portrait Sessions", description = "Individual, couples, and family portraits that capture your unique personality and connections." },
                new { title = "Brand Photography", description = "Elevate your brand with cohesive visual content that tells your story and connects with your audience." },
                new { title = "Event Coverage", description = "From intimate gatherings to large celebrations, I document the moments that matter most." }
            }
        });

        // Contact - matches exactly what's on the frontend
        await CreateContentAsync(portfolioId, "contact", new
        {
            title = "Let's Work Together",
            description = "I'd love to hear about your project and how I can help bring your vision to life.",
            email = "hello@jessicasutherland.me"
        });

        // Footer
        await CreateContentAsync(portfolioId, "footer", new
        {
            copyright = "Jessica Sutherland. All rights reserved."
        });

        await _context.SaveChangesAsync();
    }

    #endregion

    #region Busybee Portfolio Seeding

    private async Task SeedBusybeeEntityDefinitionsAsync()
    {
        var now = DateTime.UtcNow;
        var portfolioId = BusybeePortfolioId;

        // Site Config
        var siteConfigDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "site-config",
            DisplayName = "Site Configuration",
            Description = "Global site settings",
            Icon = "settings",
            IsSingleton = true,
            Category = "Settings",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "companyName", Type = "string", IsRequired = true, Label = "Company Name", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "tagline", Type = "string", Label = "Tagline", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "email", Type = "string", Label = "Contact Email", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "phone", Type = "string", Label = "Phone", Order = 4 }
            }
        };

        // Hero Section
        var heroDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "hero",
            DisplayName = "Hero Section",
            Description = "Main hero banner",
            Icon = "star",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "headline", Type = "string", IsRequired = true, Label = "Headline", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "subheadline", Type = "text", Label = "Subheadline", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "primaryCtaText", Type = "string", Label = "Primary CTA Text", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "primaryCtaLink", Type = "string", Label = "Primary CTA Link", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "secondaryCtaText", Type = "string", Label = "Secondary CTA Text", Order = 5 },
                new() { Id = Guid.NewGuid(), Name = "secondaryCtaLink", Type = "string", Label = "Secondary CTA Link", Order = 6 }
            }
        };

        // Stats Section
        var statsDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "stats",
            DisplayName = "Statistics",
            Description = "Company statistics and achievements",
            Icon = "trending_up",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "stats", Type = "array", IsRequired = true, Label = "Statistics", Order = 1,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "value", Type = "string", IsRequired = true, Label = "Value", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "label", Type = "string", IsRequired = true, Label = "Label", Order = 2 }
                    }
                }
            }
        };

        // Services Section
        var servicesDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "services",
            DisplayName = "Services",
            Description = "Marketing services offered",
            Icon = "work",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "subtitle", Type = "string", Label = "Subtitle", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "services", Type = "array", IsRequired = true, Label = "Services", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "icon", Type = "string", Label = "Icon", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 3 }
                    }
                }
            }
        };

        // About Section
        var aboutDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "about",
            DisplayName = "About Section",
            Description = "About the company",
            Icon = "info",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "description", Type = "text", Label = "Description", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "features", Type = "array", Label = "Features", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "text", Type = "string", IsRequired = true, Label = "Feature Text", Order = 1 }
                    }
                }
            }
        };

        // Testimonials Section
        var testimonialsDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "testimonials",
            DisplayName = "Testimonials",
            Description = "Client testimonials",
            Icon = "format_quote",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "subtitle", Type = "string", Label = "Subtitle", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "testimonials", Type = "array", IsRequired = true, Label = "Testimonials", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "quote", Type = "text", IsRequired = true, Label = "Quote", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "author", Type = "string", IsRequired = true, Label = "Author", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "role", Type = "string", Label = "Role/Company", Order = 3 }
                    }
                }
            }
        };

        // Contact Section
        var contactDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "contact",
            DisplayName = "Contact Section",
            Description = "Contact form and information",
            Icon = "mail",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "subtitle", Type = "string", Label = "Subtitle", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "email", Type = "string", Label = "Email", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "phone", Type = "string", Label = "Phone", Order = 4 }
            }
        };

        // Navigation Definition
        var navigationDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "navigation",
            DisplayName = "Navigation",
            Description = "Site navigation and header settings",
            Icon = "menu",
            IsSingleton = true,
            Category = "Layout",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "logoIcon", Type = "string", Label = "Logo Icon", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "logoText", Type = "string", IsRequired = true, Label = "Logo Text", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "links", Type = "array", IsRequired = true, Label = "Navigation Links", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "label", Type = "string", IsRequired = true, Label = "Label", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "href", Type = "string", IsRequired = true, Label = "Link", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "ctaText", Type = "string", Label = "CTA Button Text", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "ctaLink", Type = "string", Label = "CTA Button Link", Order = 5 }
            }
        };

        // Footer Definition
        var footerDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "footer",
            DisplayName = "Footer",
            Description = "Site footer settings",
            Icon = "bottom_navigation",
            IsSingleton = true,
            Category = "Layout",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "logoIcon", Type = "string", Label = "Logo Icon", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "logoText", Type = "string", IsRequired = true, Label = "Logo Text", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "tagline", Type = "string", Label = "Tagline", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "serviceLinks", Type = "array", Label = "Service Links", Order = 4,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "label", Type = "string", IsRequired = true, Label = "Label", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "href", Type = "string", Label = "Link", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "companyLinks", Type = "array", Label = "Company Links", Order = 5,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "label", Type = "string", IsRequired = true, Label = "Label", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "href", Type = "string", Label = "Link", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "email", Type = "string", Label = "Contact Email", Order = 6 },
                new() { Id = Guid.NewGuid(), Name = "phone", Type = "string", Label = "Contact Phone", Order = 7 },
                new() { Id = Guid.NewGuid(), Name = "socialLinks", Type = "array", Label = "Social Links", Order = 8,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "platform", Type = "string", IsRequired = true, Label = "Platform", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "icon", Type = "string", Label = "Icon", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "href", Type = "string", Label = "Link", Order = 3 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "copyright", Type = "string", Label = "Copyright Text", Order = 9 }
            }
        };

        _context.EntityDefinitions.AddRange(siteConfigDef, heroDef, statsDef, servicesDef, aboutDef, testimonialsDef, contactDef, navigationDef, footerDef);
        await _context.SaveChangesAsync();
    }

    private async Task SeedBusybeeContentAsync()
    {
        var portfolioId = BusybeePortfolioId;

        // Site Config
        await CreateContentAsync(portfolioId, "site-config", new
        {
            companyName = "The Busy Bee",
            tagline = "Digital Marketing That Creates Buzz",
            email = "hello@thebusybeeweb.com",
            phone = "(555) 123-4567"
        });

        // Hero
        await CreateContentAsync(portfolioId, "hero", new
        {
            headline = "We Make Your Brand Buzz",
            subheadline = "Award-winning digital marketing that drives real results. We're the hive mind behind some of the most successful campaigns in the industry.",
            primaryCtaText = "Start Your Journey",
            primaryCtaLink = "#contact",
            secondaryCtaText = "Explore Services",
            secondaryCtaLink = "#services"
        });

        // Stats
        await CreateContentAsync(portfolioId, "stats", new
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
        await CreateContentAsync(portfolioId, "services", new
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
        await CreateContentAsync(portfolioId, "about", new
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
        await CreateContentAsync(portfolioId, "testimonials", new
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
        await CreateContentAsync(portfolioId, "contact", new
        {
            title = "Ready to Make Some Buzz?",
            subtitle = "Let's discuss how we can help your brand reach new heights. Schedule a free consultation today.",
            email = "hello@thebusybeeweb.com",
            phone = "(555) 123-4567"
        });

        // Navigation
        await CreateContentAsync(portfolioId, "navigation", new
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
        await CreateContentAsync(portfolioId, "footer", new
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

        await _context.SaveChangesAsync();
    }

    #endregion
}
