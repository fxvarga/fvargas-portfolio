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
    private readonly string _adminPassword;

    // Well-known portfolio IDs for consistent seeding
    public static readonly Guid FernandoPortfolioId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid JessicaPortfolioId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid BusybeePortfolioId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    public DatabaseSeeder(CmsDbContext context, IAuthService authService)
    {
        _context = context;
        _authService = authService;
        // Use environment variable for admin password, fallback to default for development
        _adminPassword = Environment.GetEnvironmentVariable("CMS_ADMIN_PASSWORD") ?? "admin123";
    }

    public async Task SeedAsync()
    {
        // Seed portfolios first (required for FK constraints)
        await SeedPortfoliosAsync();

        // Seed admin user if not exists
        CmsUser? adminUser = null;
        if (!await _context.Users.AnyAsync())
        {
            adminUser = await _authService.CreateUserAsync("admin", _adminPassword, "Admin");
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

        // Blog Post Definition - for technical blog with interactive demos
        var blogPostDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "blog-post",
            DisplayName = "Blog Post",
            Description = "Technical blog posts with interactive demos",
            Icon = "article",
            IsSingleton = false,
            Category = "Content",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "slug", Type = "string", IsRequired = true, Label = "URL Slug", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "excerpt", Type = "text", IsRequired = true, Label = "Excerpt", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "category", Type = "string", Label = "Category", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "tags", Type = "tags", Label = "Tags", Order = 5 },
                new() { Id = Guid.NewGuid(), Name = "featuredImage", Type = "object", Label = "Featured Image", Order = 6,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "url", Type = "string", Label = "URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "alt", Type = "string", Label = "Alt Text", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "demoComponent", Type = "string", Label = "Demo Component Name", Order = 7 },
                new() { Id = Guid.NewGuid(), Name = "mdxFile", Type = "string", Label = "MDX File Path", Order = 8 },
                new() { Id = Guid.NewGuid(), Name = "readTime", Type = "string", Label = "Read Time", Order = 9 },
                new() { Id = Guid.NewGuid(), Name = "publishedDate", Type = "string", IsRequired = true, Label = "Published Date", Order = 10 },
                new() { Id = Guid.NewGuid(), Name = "isPublished", Type = "boolean", Label = "Is Published", Order = 11 }
            }
        };

        _context.EntityDefinitions.AddRange(
            siteConfigDef,
            heroDef,
            aboutDef,
            servicesDef,
            contactDef,
            navigationDef,
            footerDef,
            blogPostDef
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

        // Blog Posts - Using Unsplash images for featured images
        await CreateContentAsync(portfolioId, "blog-post", new
        {
            slug = "codrops-dropdown-navigation",
            title = "Building a Codrops-Style Dropdown Navigation with React",
            excerpt = "Learn how to create an animated dropdown navigation menu inspired by Codrops, featuring sliding indicators, staggered animations, and smooth hover transitions using React and CSS.",
            category = "Frontend",
            tags = new[] { "React", "CSS", "Animation", "Navigation", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop",
                alt = "Dropdown Navigation Demo - Code on screen"
            },
            demoComponent = "dropdown-navigation",
            mdxFile = "/content/blog/codrops-dropdown-navigation.md",
            readTime = "8 min read",
            publishedDate = "2025-01-03",
            isPublished = true
        });

        await CreateContentAsync(portfolioId, "blog-post", new
        {
            slug = "magnetic-button-effect",
            title = "Creating Magnetic Button Effects with React",
            excerpt = "Build captivating magnetic button effects that follow the cursor, adding delightful micro-interactions to your web applications using React and CSS transforms.",
            category = "Frontend",
            tags = new[] { "React", "CSS", "Animation", "Micro-interactions", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop",
                alt = "Magnetic Button Demo - Abstract magnetic field"
            },
            demoComponent = "magnetic-button",
            mdxFile = "/content/blog/magnetic-button-effect.md",
            readTime = "6 min read",
            publishedDate = "2025-01-04",
            isPublished = true
        });

        await CreateContentAsync(portfolioId, "blog-post", new
        {
            slug = "animated-counters",
            title = "Building Scroll-Triggered Animated Counters",
            excerpt = "Create engaging animated number counters that trigger on scroll, perfect for displaying statistics and achievements with smooth easing animations.",
            category = "Frontend",
            tags = new[] { "React", "Animation", "Intersection Observer", "Statistics", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                alt = "Animated Counters Demo - Data dashboard"
            },
            demoComponent = "animated-counter",
            mdxFile = "/content/blog/animated-counters.md",
            readTime = "7 min read",
            publishedDate = "2025-01-05",
            isPublished = true
        });

        await CreateContentAsync(portfolioId, "blog-post", new
        {
            slug = "typing-effect-animation",
            title = "Creating a Typewriter Effect with React",
            excerpt = "Build a dynamic typing effect component that cycles through phrases with realistic typing and deleting animations, perfect for hero sections and landing pages.",
            category = "Frontend",
            tags = new[] { "React", "Animation", "TypeScript", "Typography", "UI/UX" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=800&h=450&fit=crop",
                alt = "Typing Effect Demo - Vintage typewriter"
            },
            demoComponent = "typing-effect",
            mdxFile = "/content/blog/typing-effect-animation.md",
            readTime = "8 min read",
            publishedDate = "2025-01-06",
            isPublished = true
        });

        await CreateContentAsync(portfolioId, "blog-post", new
        {
            slug = "workflow-execution-gui",
            title = "Building a Workflow Execution GUI with React",
            excerpt = "Create a visual workflow builder with real-time execution progress tracking, animated connectors, and status indicators inspired by tools like Asana, Zapier, and n8n.",
            category = "Frontend",
            tags = new[] { "React", "TypeScript", "Animation", "UI/UX", "Workflow" },
            featuredImage = new
            {
                url = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
                alt = "Workflow Execution GUI - Data flow visualization"
            },
            demoComponent = "workflow-executor",
            mdxFile = "/content/blog/workflow-execution-gui.md",
            readTime = "12 min read",
            publishedDate = "2025-01-07",
            isPublished = true
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
                new() { Id = Guid.NewGuid(), Name = "email", Type = "string", Label = "Contact Email", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "linkedIn", Type = "string", Label = "LinkedIn URL", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "location", Type = "string", Label = "Location", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "resumeUrl", Type = "string", Label = "Resume PDF URL", Order = 5 }
            }
        };

        // Hero Section
        var heroDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "hero",
            DisplayName = "Hero Section",
            Description = "Main hero banner with animated titles",
            Icon = "star",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "animatedTitles", Type = "array", IsRequired = true, Label = "Animated Titles", Order = 1,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "text", Type = "string", IsRequired = true, Label = "Title Text", Order = 1 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "description", Type = "text", IsRequired = true, Label = "Description", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "sliderImages", Type = "array", Label = "Slider Images", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "Image URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "alt", Type = "string", Label = "Alt Text", Order = 2 }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "resumeButtonText", Type = "string", Label = "Resume Button Text", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "contactButtonText", Type = "string", Label = "Contact Button Text", Order = 5 }
            }
        };

        // About Section with Skills
        var aboutDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "about",
            DisplayName = "About Section",
            Description = "About section with bio and skill boxes",
            Icon = "person",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "preTitle", Type = "string", Label = "Pre-title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "headline", Type = "string", IsRequired = true, Label = "Headline", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "bio", Type = "text", IsRequired = true, Label = "Biography", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "imageUrl", Type = "string", Label = "Profile Image URL", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "coverLetterUrl", Type = "string", Label = "Cover Letter URL", Order = 5 },
                new() { Id = Guid.NewGuid(), Name = "skills", Type = "array", IsRequired = true, Label = "Skills", Order = 6,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "icon", Type = "string", Label = "Icon URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", IsRequired = true, Label = "Description", Order = 3 }
                    }
                }
            }
        };

        // Case Studies Section
        var caseStudiesDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "case-studies",
            DisplayName = "Case Studies",
            Description = "Featured case studies",
            Icon = "work",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "preTitle", Type = "string", Label = "Pre-title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "studies", Type = "array", IsRequired = true, Label = "Case Studies", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "number", Type = "string", IsRequired = true, Label = "Number", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", IsRequired = true, Label = "Description", Order = 3 },
                        new() { Id = Guid.NewGuid(), Name = "imageUrl", Type = "string", Label = "Image URL", Order = 4 },
                        new() { Id = Guid.NewGuid(), Name = "linkUrl", Type = "string", Label = "Case Study Link", Order = 5 },
                        new() { Id = Guid.NewGuid(), Name = "linkText", Type = "string", Label = "Link Text", Order = 6 }
                    }
                }
            }
        };

        // Portfolio/Gallery Section
        var portfolioDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "portfolio",
            DisplayName = "Portfolio Gallery",
            Description = "Work portfolio with gallery categories",
            Icon = "photo_library",
            IsSingleton = true,
            Category = "Sections",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "preTitle", Type = "string", Label = "Pre-title", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Section Title", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "categories", Type = "array", IsRequired = true, Label = "Portfolio Categories", Order = 3,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "subtitle", Type = "string", Label = "Subtitle", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "thumbnailUrl", Type = "string", IsRequired = true, Label = "Thumbnail URL", Order = 3 },
                        new() { Id = Guid.NewGuid(), Name = "galleryImages", Type = "array", Label = "Gallery Images", Order = 4,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "Image URL", Order = 1 }
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
                new() { Id = Guid.NewGuid(), Name = "logoUrl", Type = "string", Label = "Logo Image URL", Order = 1 },
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
                new() { Id = Guid.NewGuid(), Name = "logoUrl", Type = "string", Label = "Logo Image URL", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "thankYouMessage", Type = "string", Label = "Thank You Message", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "linkedInUrl", Type = "string", Label = "LinkedIn URL", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "copyright", Type = "string", IsRequired = true, Label = "Copyright Text", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "email", Type = "string", Label = "Contact Email", Order = 5 }
            }
        };

        // Case Study Pages (individual detail pages)
        var caseStudyPageDef = new EntityDefinition
        {
            Id = Guid.NewGuid(),
            PortfolioId = portfolioId,
            Name = "case-study-page",
            DisplayName = "Case Study Page",
            Description = "Individual case study detail pages",
            Icon = "article",
            IsSingleton = false,
            Category = "Pages",
            CreatedAt = now,
            UpdatedAt = now,
            Version = 1,
            Attributes = new List<AttributeDefinition>
            {
                new() { Id = Guid.NewGuid(), Name = "slug", Type = "string", IsRequired = true, Label = "URL Slug", Order = 1 },
                new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Page Title", Order = 2 },
                new() { Id = Guid.NewGuid(), Name = "headerTitle", Type = "string", IsRequired = true, Label = "Header Title", Order = 3 },
                new() { Id = Guid.NewGuid(), Name = "headerDescription", Type = "text", IsRequired = true, Label = "Header Description", Order = 4 },
                new() { Id = Guid.NewGuid(), Name = "headerBackgroundClass", Type = "string", Label = "Header Background CSS Class", Order = 5 },
                new() { Id = Guid.NewGuid(), Name = "sections", Type = "array", IsRequired = true, Label = "Content Sections", Order = 6,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "heading", Type = "string", IsRequired = true, Label = "Heading", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "content", Type = "text", IsRequired = true, Label = "Content", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "imageUrl", Type = "string", Label = "Image URL", Order = 3 },
                        new() { Id = Guid.NewGuid(), Name = "imagePosition", Type = "string", Label = "Image Position (left/right)", Order = 4 },
                        new() { Id = Guid.NewGuid(), Name = "links", Type = "array", Label = "Links", Order = 5,
                            Children = new List<AttributeDefinition>
                            {
                                new() { Id = Guid.NewGuid(), Name = "text", Type = "string", IsRequired = true, Label = "Link Text", Order = 1 },
                                new() { Id = Guid.NewGuid(), Name = "url", Type = "string", IsRequired = true, Label = "Link URL", Order = 2 }
                            }
                        }
                    }
                },
                new() { Id = Guid.NewGuid(), Name = "valueBoxes", Type = "array", Label = "Value Boxes (for value page)", Order = 7,
                    Children = new List<AttributeDefinition>
                    {
                        new() { Id = Guid.NewGuid(), Name = "icon", Type = "string", Label = "Icon URL", Order = 1 },
                        new() { Id = Guid.NewGuid(), Name = "title", Type = "string", IsRequired = true, Label = "Title", Order = 2 },
                        new() { Id = Guid.NewGuid(), Name = "description", Type = "text", IsRequired = true, Label = "Description", Order = 3 }
                    }
                }
            }
        };

        _context.EntityDefinitions.AddRange(siteConfigDef, heroDef, aboutDef, caseStudiesDef, portfolioDef, navigationDef, footerDef, caseStudyPageDef);
        await _context.SaveChangesAsync();
    }

    private async Task SeedJessicaContentAsync()
    {
        var portfolioId = JessicaPortfolioId;

        // Site Config
        await CreateContentAsync(portfolioId, "site-config", new
        {
            siteTitle = "Jessica Sutherland Portfolio",
            email = "jessutherland@hotmail.com",
            linkedIn = "https://www.linkedin.com/in/jessica-m-sutherland-9891661a/",
            location = "Charlotte, North Carolina",
            resumeUrl = "/JessicaSutherland.Resume2023.pdf"
        });

        // Navigation
        await CreateContentAsync(portfolioId, "navigation", new
        {
            logoUrl = "/images/logo.png",
            links = new[]
            {
                new { label = "About Me", href = "#about" },
                new { label = "Case Studies", href = "#case-studies" },
                new { label = "Portfolio", href = "#portfolio" },
                new { label = "Contact", href = "mailto:jessutherland@hotmail.com?subject=Contacting from portfolio site" }
            }
        });

        // Hero
        await CreateContentAsync(portfolioId, "hero", new
        {
            animatedTitles = new[]
            {
                new { text = "Marketing Leader" },
                new { text = "Brand Strategist" },
                new { text = "Creative Thinker" },
                new { text = "Transformative Leader" }
            },
            description = "I am an innovative and action-oriented professional with 12+ years of experience in marketing and real estate living in Charlotte, North Carolina.",
            sliderImages = new[]
            {
                new { url = "/images/ginko.png", alt = "Ginkgo Project" },
                new { url = "/images/510.png", alt = "5/ten Project" },
                new { url = "/images/indigo.png", alt = "Indigo Project" }
            },
            resumeButtonText = "My Resume",
            contactButtonText = "Contact Me"
        });

        // About
        await CreateContentAsync(portfolioId, "about", new
        {
            preTitle = "A little about me",
            headline = "I'm a transformative leader with a creative spark.",
            bio = "I have a creative mindset, a love for storytelling, and a talent for crafting unique experiences. I'm also a champion of transformational initiatives that create value and drive profitable growth.",
            imageUrl = "/images/jessicasutherland.jpg",
            coverLetterUrl = "/images/coverletter.jpg",
            skills = new[]
            {
                new { icon = "/images/service0.svg", title = "Strategist", description = "I influence strategy, go-to-market, brand, and sales enablement to drive change and facilitate profitable growth." },
                new { icon = "/images/service1.svg", title = "Operational Excellence", description = "Mover of ideas into action. I'm focused on the continuous implementation and improvement of standard operating procedures." },
                new { icon = "/images/service3.svg", title = "Creative Thinker", description = "Whether I'm problem-solving, telling a story, or creating an experience, I excel at producing unique solutions that deliver results." },
                new { icon = "/images/service4.svg", title = "Collaborator", description = "Exceptional communicator, with the ability to work with the C-suite, develop and mentor individuals, and collaborate with cross-functional teams." }
            }
        });

        // Case Studies
        await CreateContentAsync(portfolioId, "case-studies", new
        {
            preTitle = "What I bring to the table",
            title = "Case Studies",
            studies = new[]
            {
                new { number = "01", title = "I develop brands that earn a competitive advantage", description = "With the collaboration of various agencies, graphic designers, and web developers, I directed the creation of successful brands for 5/ten Management & Ginkgo Residential.", imageUrl = "/images/brandcasestudy.jpg", linkUrl = "/case-study/5ten", linkText = "view 5/ten case study" },
                new { number = "02", title = "Create engaging experiences", description = "Getting to know and understanding my audience allows me to draw inspiration from their daily lives to execute an engaging living experience. The Collective artist in residence program is a great example of this in action.", imageUrl = "/images/experiencecase.jpg", linkUrl = "/case-study/experience", linkText = "view The Collective case study" },
                new { number = "03", title = "Digital marketing transformation and execution", description = "I believe in data-driven marketing insights that innovate go-to-market campaigns to drive growth.", imageUrl = "/images/hubsmartphone.jpg", linkUrl = "/case-study/digital-marketing", linkText = "view my digital marketing case studies" },
                new { number = "04", title = "Focused on creating value", description = "I have a talent for managing resources, creating agile operating procedures, and developing individuals.", imageUrl = "/images/valuethumb.jpg", linkUrl = "/case-study/value", linkText = "view how i create value" }
            }
        });

        // Portfolio - using Dictionary for flexible JSON serialization
        var portfolioCategories = new List<Dictionary<string, object>>
        {
            new Dictionary<string, object>
            {
                { "title", "Web Development" },
                { "subtitle", "corporate, multifamily, commercial" },
                { "thumbnailUrl", "/images/ginko.jpg" },
                { "galleryImages", new[] { new { url = "/images/ginkgo/1 Landing.JPG" }, new { url = "/images/ginkgo/2 Properties.JPG" }, new { url = "/images/ginkgo/3 Ginkgogreen.JPG" }, new { url = "/images/ginkgo/4 News.JPG" } } }
            },
            new Dictionary<string, object>
            {
                { "title", "Digital Media" },
                { "subtitle", "SOCIAL, EMAIL, VIDEO & PHOTOGRAPHY" },
                { "thumbnailUrl", "/images/eblast.jpg" },
                { "galleryImages", new[] { new { url = "/images/digitalmedia/Collective - eblast-01.jpg" }, new { url = "/images/digitalmedia/farfield eblast.JPG" }, new { url = "/images/digitalmedia/ginkgo green.JPG" } } }
            },
            new Dictionary<string, object>
            {
                { "title", "Marketing Campaigns" },
                { "subtitle", "connecting with the customer" },
                { "thumbnailUrl", "/images/digimark.jpg" },
                { "galleryImages", new[] { new { url = "/images/marketingcampaign/ginkgogreen.JPG" }, new { url = "/images/marketingcampaign/makeithappen.JPG" }, new { url = "/images/marketingcampaign/ourcommitment.JPG" } } }
            },
            new Dictionary<string, object>
            {
                { "title", "Marketing Collateral" },
                { "subtitle", "branding" },
                { "thumbnailUrl", "/images/brandguide.jpg" },
                { "galleryImages", new[] { new { url = "/images/marketingcoll/brand guide.JPG" }, new { url = "/images/marketingcoll/collective rack card.JPG" }, new { url = "/images/marketingcoll/indigo brochure.JPG" } } }
            },
            new Dictionary<string, object>
            {
                { "title", "Communication" },
                { "subtitle", "PUBLIC RELATIONS" },
                { "thumbnailUrl", "/images/comm.jpg" },
                { "galleryImages", new[] { new { url = "/images/xcomm/corporate comm.JPG" } } }
            },
            new Dictionary<string, object>
            {
                { "title", "Swag Shop" },
                { "subtitle", "a digital hub" },
                { "thumbnailUrl", "/images/swag.jpg" },
                { "galleryImages", Array.Empty<object>() }
            }
        };

        await CreateContentAsync(portfolioId, "portfolio", new
        {
            preTitle = "My Work",
            title = "Select Portfolio Projects",
            categories = portfolioCategories
        });

        // Case Study Pages
        // 5/ten Case Study
        await CreateContentAsync(portfolioId, "case-study-page", new Dictionary<string, object>
        {
            { "slug", "5ten" },
            { "title", "Jessica Sutherland Portfolio - 5/ten management case study" },
            { "headerTitle", "5/ten Case Study" },
            { "headerDescription", "5/ten Management was getting underway when I joined the firm in 2018. The goal was to build a brand identity that distinguished 5/ten as a management firm yet remained connected with their affiliate Ram Realty Advisors." },
            { "headerBackgroundClass", "fivetenbg" },
            { "sections", new List<Dictionary<string, object>>
                {
                    new Dictionary<string, object> { { "heading", "Developed and implemented the creative vision" }, { "content", "I led the planning, procurement, and execution of all tasks within the branding process, leading all marketing initiatives across internal and external digital and print channels." }, { "imageUrl", "/images/fivetencase/web-12.JPG" }, { "imagePosition", "right" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "The identity for 5/ten Management was created" }, { "content", "Having a defined brand led to an immediate positive impact on current associates and how they promoted the firm, realized company values, and culture." }, { "imageUrl", "/images/fivetencase/5ten-visual-language.JPG" }, { "imagePosition", "left" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "Who. What. How." }, { "content", "We communicated the proposition statement to interested parties. It began the connection with customers, informed business partners, and set the scene for 5/ten to establish itself as a management firm." }, { "imageUrl", "/images/whowhat.jpg" }, { "imagePosition", "right" }, { "links", new List<object>() } }
                }
            },
            { "valueBoxes", new List<object>() }
        });

        // The Collective / Experience Case Study
        await CreateContentAsync(portfolioId, "case-study-page", new Dictionary<string, object>
        {
            { "slug", "experience" },
            { "title", "Jessica Sutherland Portfolio - The Collective case study" },
            { "headerTitle", "The Collective Case Study" },
            { "headerDescription", "The Collective was a new development comprised of multi-family residential units and retail space located adjacent to the NoDa and Villa Heights neighborhoods in Charlotte, NC. With the multi-family industry thriving and four new developments being built nearby and at the same time as The Collective, it was crucial to the success of the project that I prepare a unique marketing strategy." },
            { "headerBackgroundClass", "experiencebg" },
            { "sections", new List<Dictionary<string, object>>
                {
                    new Dictionary<string, object> { { "heading", "Pulling inspiration from the deep connection NoDa has to the arts" }, { "content", "The marketing approach emphasized art through both design and community. From interior spaces adorned in artwork by local artists to exterior murals, art-centered events, and socials, capped by an Artist in Residence Program (AIR). The goal was for the resident not just to see art but to experience art in their daily lives." }, { "imageUrl", "/images/wallnoda.jpg" }, { "imagePosition", "right" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "Artist in Residence" }, { "content", "Bringing the Artist in Residence (AIR) project to life at The Collective is my favorite project to date. AIR is a unique opportunity for creatives to share their passion with The Collective community while living rent-free." }, { "imageUrl", "/images/airs2.jpg" }, { "imagePosition", "left" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "Three local creatives were selected" }, { "content", "Mark, a photographer and videographer; Alex, a muralist and art studio owner; and Jessica, a local social influencer. In addition to offering their creative skills, they also came with a significant social media following and strong ties to the local community. With my direction, the AIR team successfully infused art into the community, provided authentic content, and helped cross-market the property." }, { "imageUrl", "/images/airs.jpg" }, { "imagePosition", "right" }, { "links", new List<object>() } }
                }
            },
            { "valueBoxes", new List<object>() }
        });

        // Digital Marketing Case Study
        await CreateContentAsync(portfolioId, "case-study-page", new Dictionary<string, object>
        {
            { "slug", "digital-marketing" },
            { "title", "Jessica Sutherland Portfolio - digital marketing case study" },
            { "headerTitle", "Digital Marketing Case Studies" },
            { "headerDescription", "I believe in data-driven marketing insights that innovate go-to-market campaigns to drive growth." },
            { "headerBackgroundClass", "digitalmarketingbg" },
            { "sections", new List<Dictionary<string, object>>
                {
                    new Dictionary<string, object> { { "heading", "Websites" }, { "content", "I've led the strategic direction for over 50 websites. The sites range in variety from corporate pages to shopping centers and apartment communities." }, { "imageUrl", "/images/devices.jpg" }, { "imagePosition", "right" }, { "links", new List<Dictionary<string, string>> { new Dictionary<string, string> { { "text", "Ginko Residential website" }, { "url", "https://www.ginkgores.com/" } }, new Dictionary<string, string> { { "text", "Hub Southend website" }, { "url", "https://hubsouthend.com/" } } } } },
                    new Dictionary<string, object> { { "heading", "Social Media Marketing" }, { "content", "I've led the company-wide implementation of social media management software. I've also had the pleasure of partnering with social influencers and digital agencies on creating unique campaigns & ads." }, { "imageUrl", "/images/socialmarketing.jpg" }, { "imagePosition", "left" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "Communication" }, { "content", "I have experience in email marketing, composing newsletters, company blogs, press releases, and internal/external company communications." }, { "imageUrl", "/images/indigobrochure.jpg" }, { "imagePosition", "right" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "Video & Photography" }, { "content", "The power of a photo or video is undeniable! These easy to digest mediums make them a critical marketing tool in order to remain competitive. I've orchestrated the production of several marketing videos and professional photoshoots that range in type and format." }, { "imageUrl", "/images/nodavideo.jpg" }, { "imagePosition", "left" }, { "links", new List<Dictionary<string, string>> { new Dictionary<string, string> { { "text", "New construction video" }, { "url", "https://vimeo.com/227464295" } }, new Dictionary<string, string> { { "text", "Neighborhood/lifestyle" }, { "url", "https://player.vimeo.com/external/320246655.hd.mp4?s=591bf703e42a058fabeda1d292d12ed5ddc9736b&profile_id=174" } } } } }
                }
            },
            { "valueBoxes", new List<object>() }
        });

        // Value Case Study
        await CreateContentAsync(portfolioId, "case-study-page", new Dictionary<string, object>
        {
            { "slug", "value" },
            { "title", "Jessica Sutherland Portfolio - Value proposition" },
            { "headerTitle", "Focused on creating value" },
            { "headerDescription", "I have a talent for managing resources, creating agile operating procedures, and developing individuals." },
            { "headerBackgroundClass", "valuebg" },
            { "sections", new List<Dictionary<string, object>>
                {
                    new Dictionary<string, object> { { "heading", "A reputation for providing solutions that positively impact revenue and growth" }, { "content", "Adjacent are a few concrete examples of the value I provide as a marketing operations leader." }, { "imageUrl", "/images/jessicasutherlandblackjacket.jpg" }, { "imagePosition", "left" }, { "links", new List<object>() } }
                }
            },
            { "valueBoxes", new List<Dictionary<string, string>>
                {
                    new Dictionary<string, string> { { "icon", "/images/value0.png" }, { "title", "Saved $200K+" }, { "description", "I updated the portfolio media buy for 5/ten Management, saving the firm around $200,000 in yearly advertising expenses while increasing qualified lead volume by 40%." } },
                    new Dictionary<string, string> { { "icon", "/images/service1.svg" }, { "title", "Reduced costs by $25K" }, { "description", "I restructured the call center and lead-tracking platform package for Ginkgo Residential, resulting in a $25,000 reduction in yearly costs." } },
                    new Dictionary<string, string> { { "icon", "/images/service3.svg" }, { "title", "Developed company training program" }, { "description", "I have developed marketing and sales training programs. I've led online, site, and classroom-style training." } },
                    new Dictionary<string, string> { { "icon", "/images/service4.svg" }, { "title", "Trained over 200 professionals" }, { "description", "Throughout my career, I've had the privilege to train and motivate over 200 sales associates. I've traveled nationwide to conduct training seminars and have spoken at national conferences." } }
                }
            }
        });

        // Ginkgo Case Study
        await CreateContentAsync(portfolioId, "case-study-page", new Dictionary<string, object>
        {
            { "slug", "ginkgo" },
            { "title", "Jessica Sutherland Portfolio - Ginko Residential case study" },
            { "headerTitle", "Ginkgo Case Study" },
            { "headerDescription", "Ginkgo Residential was an established property management firm; however, the company's vision and the mission had evolved. Therefore, the goal was to refresh the brand and align the new philosophy. An additional objective was to create a sense of brand unity throughout the portfolio." },
            { "headerBackgroundClass", "ginkobg" },
            { "sections", new List<Dictionary<string, object>>
                {
                    new Dictionary<string, object> { { "heading", "Rebrand of over 30 assets throughout the Southeast" }, { "content", "I led the rebranding efforts which included new logos, color palettes, collateral, signage, websites, digital media, and more." }, { "imageUrl", "/images/ginkgo case/ginkgomobile.jpg" }, { "imagePosition", "right" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "A unified brand identity" }, { "content", "All assets embodied the Ginkgo brand. The sales teams saw significant positive changes as traffic and sales increased, brand awareness was established (for the first time), and the staff reported positive feedback from current customers." }, { "imageUrl", "/images/ginkotablet.jpg" }, { "imagePosition", "left" }, { "links", new List<object>() } },
                    new Dictionary<string, object> { { "heading", "A fresh twist for the Ginkgo corporate identity" }, { "content", "At the corporate level, the revised vision, values, and mission were defined and communicated. I replaced the outdated image with a fresh approach that revitalized the company and allowed Ginkgo to reposition itself within the market. I also ensured (previously non-existent) brand cohesiveness throughout departments." }, { "imageUrl", "/images/ginkgo case/ginkgo-res-before-after.JPG" }, { "imagePosition", "right" }, { "links", new List<object>() } }
                }
            },
            { "valueBoxes", new List<object>() }
        });

        // Footer
        await CreateContentAsync(portfolioId, "footer", new
        {
            logoUrl = "/images/logo.png",
            thankYouMessage = "Thank you for looking through my portfolio",
            linkedInUrl = "https://www.linkedin.com/in/jessica-m-sutherland-9891661a/",
            copyright = "© 2024 jessicasutherland.me",
            email = "jessutherland@hotmail.com"
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
