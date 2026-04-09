namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions and seeds content for the Brad Earnhardt portfolio.
/// Sections: site-config, navigation, hero, about, resume, services, portfolio, stats, contact, blog-post, footer
/// </summary>
public class _20260401000001_BradEntityDefinitionsAndContent : ContentMigration
{
    public override string Description => "Create Brad Earnhardt entity definitions and seed content";

    private static readonly Guid PortfolioId = ContentMigrationContext.BradPortfolioId;

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        // ──────────────────────────────────────────────────
        // ENTITY DEFINITIONS
        // ──────────────────────────────────────────────────

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "site-config", def => def
            .DisplayName("Site Configuration")
            .Description("Global site settings for Brad's portfolio")
            .Icon("settings")
            .Category("Settings")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("brandName").Type("string").Required().Label("Brand Name"))
            .AddAttribute(a => a.Name("brandHighlight").Type("string").Required().Label("Brand Highlight"))
            .AddAttribute(a => a.Name("contactEmail").Type("string").Label("Contact Email"))
            .AddAttribute(a => a.Name("contactPhone").Type("string").Label("Contact Phone"))
            .AddAttribute(a => a.Name("location").Type("string").Label("Location")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "navigation", def => def
            .DisplayName("Navigation")
            .Description("Site navigation links and CTA")
            .Icon("menu")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("links").Type("array").Label("Nav Links")
                .Children(c => c
                    .Add(ca => ca.Name("label").Type("string").Required().Label("Label"))
                    .Add(ca => ca.Name("href").Type("string").Required().Label("Link"))))
            .AddAttribute(a => a.Name("ctaText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaLink").Type("string").Label("CTA Button Link")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "hero", def => def
            .DisplayName("Hero Section")
            .Description("Main banner section with photo and headline")
            .Icon("star")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("greeting").Type("string").Label("Greeting Text"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Main Heading"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("ctaText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaLink").Type("string").Label("CTA Link"))
            .AddAttribute(a => a.Name("heroImage").Type("string").Label("Hero Image URL"))
            .AddAttribute(a => a.Name("badgeText").Type("string").Label("Badge Text")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "about", def => def
            .DisplayName("About Section")
            .Description("About me section with bio and personal info")
            .Icon("person")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("sectionLabel").Type("string").Label("Section Label"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("ctaText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaLink").Type("string").Label("CTA Link"))
            .AddAttribute(a => a.Name("aboutImage").Type("string").Label("About Image URL"))
            .AddAttribute(a => a.Name("name").Type("string").Label("Full Name"))
            .AddAttribute(a => a.Name("location").Type("string").Label("Location"))
            .AddAttribute(a => a.Name("yearsExperience").Type("string").Label("Years of Experience"))
            .AddAttribute(a => a.Name("language").Type("string").Label("Language")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "resume", def => def
            .DisplayName("Resume Section")
            .Description("Education and professional experience")
            .Icon("document")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("sectionLabel").Type("string").Label("Section Label"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("education").Type("array").Label("Education")
                .Children(c => c
                    .Add(ca => ca.Name("institution").Type("string").Required().Label("Institution"))
                    .Add(ca => ca.Name("degree").Type("string").Label("Degree"))
                    .Add(ca => ca.Name("field").Type("string").Label("Field of Study"))))
            .AddAttribute(a => a.Name("experience").Type("array").Label("Experience")
                .Children(c => c
                    .Add(ca => ca.Name("dates").Type("string").Required().Label("Date Range"))
                    .Add(ca => ca.Name("company").Type("string").Required().Label("Company"))
                    .Add(ca => ca.Name("role").Type("string").Required().Label("Role"))
                    .Add(ca => ca.Name("location").Type("string").Label("Location")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "services", def => def
            .DisplayName("Services Section")
            .Description("Professional services offered")
            .Icon("briefcase")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("sectionLabel").Type("string").Label("Section Label"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("items").Type("array").Label("Services")
                .Children(c => c
                    .Add(ca => ca.Name("number").Type("string").Label("Number"))
                    .Add(ca => ca.Name("title").Type("string").Required().Label("Title"))
                    .Add(ca => ca.Name("description").Type("text").Label("Description")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "portfolio", def => def
            .DisplayName("Portfolio Section")
            .Description("Work samples and projects")
            .Icon("image")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("sectionLabel").Type("string").Label("Section Label"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("items").Type("array").Label("Portfolio Items")
                .Children(c => c
                    .Add(ca => ca.Name("title").Type("string").Required().Label("Title"))
                    .Add(ca => ca.Name("category").Type("string").Label("Category"))
                    .Add(ca => ca.Name("image").Type("string").Label("Image URL"))
                    .Add(ca => ca.Name("description").Type("text").Label("Description")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "stats", def => def
            .DisplayName("Stats Section")
            .Description("Counter statistics")
            .Icon("chart")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("items").Type("array").Label("Stats")
                .Children(c => c
                    .Add(ca => ca.Name("value").Type("string").Required().Label("Value"))
                    .Add(ca => ca.Name("suffix").Type("string").Label("Suffix"))
                    .Add(ca => ca.Name("label").Type("string").Required().Label("Label")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "contact", def => def
            .DisplayName("Contact Section")
            .Description("Contact form and information")
            .Icon("mail")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("sectionLabel").Type("string").Label("Section Label"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Email"))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Phone"))
            .AddAttribute(a => a.Name("location").Type("string").Label("Location"))
            .AddAttribute(a => a.Name("submitButtonText").Type("string").Label("Submit Button Text"))
            .AddAttribute(a => a.Name("successMessage").Type("string").Label("Success Message")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "blog-post", def => def
            .DisplayName("Blog Post")
            .Description("Blog posts for Brad's portfolio")
            .Icon("article")
            .Category("Content")
            .IsSingleton(false)
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Title"))
            .AddAttribute(a => a.Name("slug").Type("string").Required().Label("Slug"))
            .AddAttribute(a => a.Name("excerpt").Type("text").Label("Excerpt"))
            .AddAttribute(a => a.Name("coverImage").Type("string").Label("Cover Image"))
            .AddAttribute(a => a.Name("category").Type("string").Label("Category"))
            .AddAttribute(a => a.Name("date").Type("string").Label("Date"))
            .AddAttribute(a => a.Name("content").Type("richtext").Label("Content")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "footer", def => def
            .DisplayName("Footer")
            .Description("Site footer content")
            .Icon("dock")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("tagline").Type("text").Label("Tagline"))
            .AddAttribute(a => a.Name("ctaHeading").Type("string").Label("CTA Heading"))
            .AddAttribute(a => a.Name("ctaButtonText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaButtonLink").Type("string").Label("CTA Button Link"))
            .AddAttribute(a => a.Name("copyrightTemplate").Type("string").Label("Copyright Template"))
            .AddAttribute(a => a.Name("socialLinks").Type("array").Label("Social Links")
                .Children(c => c
                    .Add(ca => ca.Name("platform").Type("string").Required().Label("Platform"))
                    .Add(ca => ca.Name("url").Type("string").Required().Label("URL"))
                    .Add(ca => ca.Name("icon").Type("string").Label("Icon")))));

        await ctx.SaveChangesAsync();

        // ──────────────────────────────────────────────────
        // CONTENT SEEDING
        // ──────────────────────────────────────────────────

        await ctx.UpsertContentAsync(PortfolioId, "site-config", "default", new
        {
            brandName = "Brad",
            brandHighlight = "Earnhardt",
            contactEmail = "uxbrad@bdesigns.net",
            contactPhone = "704-323-6921",
            location = "Charlotte, NC"
        });

        await ctx.UpsertContentAsync(PortfolioId, "navigation", "default", new
        {
            links = new[]
            {
                new { label = "Home", href = "#home" },
                new { label = "About", href = "#about" },
                new { label = "Services", href = "#services" },
                new { label = "Resume", href = "#resume" },
                new { label = "Portfolio", href = "#portfolio" },
                new { label = "Blog", href = "#blog" }
            },
            ctaText = "Contact Me",
            ctaLink = "#contact"
        });

        await ctx.UpsertContentAsync(PortfolioId, "hero", "default", new
        {
            greeting = "I'm glad you're here.",
            heading = "Hi I'm Brad Earnhardt — Crafting intuitive digital experiences that put users first",
            description = "Illustrator turned UX specialist with 20+ years of experience delivering intuitive, accessible software and web applications. Focused on enhancing user experience through detail-oriented, user-centered design and development.",
            ctaText = "Let's Chat",
            ctaLink = "#contact",
            heroImage = "/images/brad-hero.png",
            badgeText = "Senior UI/UX Designer"
        });

        await ctx.UpsertContentAsync(PortfolioId, "about", "default", new
        {
            sectionLabel = "About Me",
            heading = "I'm creating user-centered design & digital experiences.",
            description = "Illustrator/Designer now specializing in user-centered design and development. Focused on delivering intuitive and accessible software and web applications, with a strong emphasis on enhancing user experience. A detail-oriented professional, committed to continuous learning and team collaboration, to craft visually appealing and user-centric digital solutions.",
            ctaText = "Contact Me",
            ctaLink = "#contact",
            aboutImage = "/images/brad-about.png",
            name = "Brad Earnhardt",
            location = "Charlotte, NC",
            yearsExperience = "20+",
            language = "English"
        });

        await ctx.UpsertContentAsync(PortfolioId, "resume", "default", new
        {
            sectionLabel = "Resume",
            heading = "Education & Experience",
            education = new[]
            {
                new
                {
                    institution = "University of North Carolina at Charlotte",
                    degree = "Bachelor of Fine Arts",
                    field = "Illustration, Graphic Design"
                }
            },
            experience = new[]
            {
                new
                {
                    dates = "2023 - 2024",
                    company = "Spacelabs Healthcare",
                    role = "Senior UI/UX Designer",
                    location = "Charlotte, NC (Remote)"
                },
                new
                {
                    dates = "2018 - 2023",
                    company = "PeraHealth: The Rothman Index",
                    role = "Senior UI/UX Engineer",
                    location = "Charlotte, NC (Remote)"
                },
                new
                {
                    dates = "2012 - 2018",
                    company = "AXS Group LLC (Carbonhouse)",
                    role = "Front-End Web Developer",
                    location = "Charlotte, NC"
                },
                new
                {
                    dates = "2006 - 2012",
                    company = "American City Business Journals",
                    role = "UI Designer / Front-End Developer",
                    location = "Charlotte, NC"
                },
                new
                {
                    dates = "2006",
                    company = "Apex Systems",
                    role = "Web Designer / HTML & CSS Developer",
                    location = "Charlotte, NC"
                },
                new
                {
                    dates = "2000 - Present",
                    company = "Freelance Web Guy",
                    role = "Designer / Developer / Consultant",
                    location = "Charlotte, NC"
                }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "services", "default", new
        {
            sectionLabel = "Services",
            heading = "My Services",
            items = new[]
            {
                new
                {
                    number = "1",
                    title = "UI/UX Design",
                    description = "Comprehensive user interface and experience design for web and mobile applications. From wireframes to high-fidelity prototypes, creating intuitive interfaces that delight users and meet business objectives."
                },
                new
                {
                    number = "2",
                    title = "Front-End Development",
                    description = "Clean, responsive, and accessible front-end development using modern frameworks like React and Angular. Building pixel-perfect implementations with HTML, CSS/SASS, and JavaScript."
                },
                new
                {
                    number = "3",
                    title = "Design Systems",
                    description = "Creating and maintaining cohesive visual libraries and design systems that serve as the single source of truth for design standards across all products and platforms."
                },
                new
                {
                    number = "4",
                    title = "Prototyping & User Testing",
                    description = "Interactive prototyping in Figma and Adobe XD for user testing. Gathering feedback to refine design solutions, ensuring WCAG compliance and optimal accessibility for all users."
                }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "portfolio", "default", new
        {
            sectionLabel = "Portfolio",
            heading = "Recent Design Work",
            items = new[]
            {
                new
                {
                    title = "Rothman Index Mobile App",
                    category = "UI/UX Design",
                    image = "/images/portfolio-1.jpg",
                    description = "FDA 508 cleared mobile application for real-time patient acuity monitoring."
                },
                new
                {
                    title = "SafeNSound Platform",
                    category = "Product Design",
                    image = "/images/portfolio-2.jpg",
                    description = "Healthcare monitoring platform design for Spacelabs Healthcare."
                },
                new
                {
                    title = "Rainer Monitor Software",
                    category = "UI/UX Design",
                    image = "/images/portfolio-3.jpg",
                    description = "Medical device monitoring software interface design."
                },
                new
                {
                    title = "Venue Websites Collection",
                    category = "Web Development",
                    image = "/images/portfolio-4.jpg",
                    description = "Over 70 world-class venue websites built at Carbonhouse."
                },
                new
                {
                    title = "Business Journals Redesign",
                    category = "Web Design",
                    image = "/images/portfolio-5.jpg",
                    description = "Full site redesign of The Business Journals across 45 markets."
                },
                new
                {
                    title = "RI Analytics Dashboard",
                    category = "Dashboard Design",
                    image = "/images/portfolio-6.jpg",
                    description = "Analytics and reporting dashboard for the Rothman Index suite."
                }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "stats", "default", new
        {
            items = new[]
            {
                new { value = "20", suffix = "+", label = "Years Experience" },
                new { value = "70", suffix = "+", label = "Websites Built" },
                new { value = "6", suffix = "+", label = "Companies Served" },
                new { value = "3", suffix = "", label = "Major Products" }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "contact", "default", new
        {
            sectionLabel = "Contact",
            heading = "Need help? Get in touch now!",
            description = "I'm always interested in hearing about new projects and opportunities. Whether you need a complete UI/UX overhaul or help with front-end development, let's talk.",
            email = "uxbrad@bdesigns.net",
            phone = "704-323-6921",
            location = "Charlotte, NC",
            submitButtonText = "Send Message",
            successMessage = "Thank you! Your message has been sent. I'll get back to you soon."
        });

        await ctx.UpsertContentAsync(PortfolioId, "footer", "default", new
        {
            tagline = "Senior UI/UX Designer crafting intuitive digital experiences. Focused on delivering accessible, user-centered design solutions.",
            ctaHeading = "Let's Make a Consultation With Me",
            ctaButtonText = "Contact Me",
            ctaButtonLink = "#contact",
            copyrightTemplate = "© {year} Brad Earnhardt. All rights reserved.",
            socialLinks = new[]
            {
                new { platform = "LinkedIn", url = "https://www.linkedin.com/in/bradearnhardt/", icon = "linkedin" },
                new { platform = "Email", url = "mailto:uxbrad@bdesigns.net", icon = "email" }
            }
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        // Delete content first
        var entityTypes = new[]
        {
            "site-config", "navigation", "hero", "about", "resume",
            "services", "portfolio", "stats", "contact", "blog-post", "footer"
        };

        foreach (var entityType in entityTypes)
        {
            await ctx.DeleteContentAsync(PortfolioId, entityType, "default");
        }

        // Then delete definitions
        foreach (var entityType in entityTypes)
        {
            await ctx.DeleteEntityDefinitionAsync(PortfolioId, entityType);
        }

        await ctx.SaveChangesAsync();
    }
}
