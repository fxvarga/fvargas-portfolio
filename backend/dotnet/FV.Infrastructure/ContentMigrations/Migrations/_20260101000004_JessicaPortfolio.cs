namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions and content for Jessica's portfolio.
/// </summary>
public class _20260101000004_JessicaPortfolio : ContentMigration
{
    public override string Description => "Create entity definitions and content for Jessica portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.JessicaPortfolioId;

        // Entity Definitions
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "site-config", def => def
            .DisplayName("Site Configuration").Description("Global site settings").Icon("settings").Category("Settings").IsSingleton(true)
            .AddAttribute(a => a.Name("siteTitle").Type("string").Required().Label("Site Title"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Contact Email"))
            .AddAttribute(a => a.Name("linkedIn").Type("string").Label("LinkedIn URL"))
            .AddAttribute(a => a.Name("location").Type("string").Label("Location"))
            .AddAttribute(a => a.Name("resumeUrl").Type("string").Label("Resume PDF URL")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "hero", def => def
            .DisplayName("Hero Section").Description("Main hero banner with animated titles").Icon("star").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("animatedTitles").Type("array").Required().Label("Animated Titles"))
            .AddAttribute(a => a.Name("description").Type("text").Required().Label("Description"))
            .AddAttribute(a => a.Name("sliderImages").Type("array").Label("Slider Images"))
            .AddAttribute(a => a.Name("resumeButtonText").Type("string").Label("Resume Button Text"))
            .AddAttribute(a => a.Name("contactButtonText").Type("string").Label("Contact Button Text")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "about", def => def
            .DisplayName("About Section").Description("About section with bio and skill boxes").Icon("person").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("preTitle").Type("string").Label("Pre-title"))
            .AddAttribute(a => a.Name("headline").Type("string").Required().Label("Headline"))
            .AddAttribute(a => a.Name("bio").Type("text").Required().Label("Biography"))
            .AddAttribute(a => a.Name("imageUrl").Type("string").Label("Profile Image URL"))
            .AddAttribute(a => a.Name("coverLetterUrl").Type("string").Label("Cover Letter URL"))
            .AddAttribute(a => a.Name("skills").Type("array").Required().Label("Skills")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "case-studies", def => def
            .DisplayName("Case Studies").Description("Featured case studies").Icon("work").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("preTitle").Type("string").Label("Pre-title"))
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Section Title"))
            .AddAttribute(a => a.Name("studies").Type("array").Required().Label("Case Studies")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "portfolio", def => def
            .DisplayName("Portfolio Gallery").Description("Work portfolio with gallery categories").Icon("photo_library").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("preTitle").Type("string").Label("Pre-title"))
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Section Title"))
            .AddAttribute(a => a.Name("categories").Type("array").Required().Label("Portfolio Categories")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "navigation", def => def
            .DisplayName("Navigation").Description("Site navigation and header settings").Icon("menu").Category("Layout").IsSingleton(true)
            .AddAttribute(a => a.Name("logoUrl").Type("string").Label("Logo Image URL"))
            .AddAttribute(a => a.Name("links").Type("array").Required().Label("Navigation Links")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "footer", def => def
            .DisplayName("Footer").Description("Site footer settings").Icon("bottom_navigation").Category("Layout").IsSingleton(true)
            .AddAttribute(a => a.Name("logoUrl").Type("string").Label("Logo Image URL"))
            .AddAttribute(a => a.Name("thankYouMessage").Type("string").Label("Thank You Message"))
            .AddAttribute(a => a.Name("linkedInUrl").Type("string").Label("LinkedIn URL"))
            .AddAttribute(a => a.Name("copyright").Type("string").Required().Label("Copyright Text"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Contact Email")));

        await ctx.UpsertEntityDefinitionAsync(portfolioId, "case-study-page", def => def
            .DisplayName("Case Study Page").Description("Individual case study detail pages").Icon("article").Category("Pages").IsCollection()
            .AddAttribute(a => a.Name("slug").Type("string").Required().Label("URL Slug"))
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Page Title"))
            .AddAttribute(a => a.Name("headerTitle").Type("string").Required().Label("Header Title"))
            .AddAttribute(a => a.Name("headerDescription").Type("text").Required().Label("Header Description"))
            .AddAttribute(a => a.Name("headerBackgroundClass").Type("string").Label("Header Background CSS Class"))
            .AddAttribute(a => a.Name("sections").Type("array").Required().Label("Content Sections"))
            .AddAttribute(a => a.Name("valueBoxes").Type("array").Label("Value Boxes")));

        await ctx.SaveChangesAsync();

        // Content - Site Config
        await ctx.UpsertContentAsync(portfolioId, "site-config", "default", new
        {
            siteTitle = "Jessica Sutherland Portfolio",
            email = "jessutherland@hotmail.com",
            linkedIn = "https://www.linkedin.com/in/jessica-m-sutherland-9891661a/",
            location = "Charlotte, North Carolina",
            resumeUrl = "/JessicaSutherland.Resume2023.pdf"
        });

        // Navigation
        await ctx.UpsertContentAsync(portfolioId, "navigation", "default", new
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
        await ctx.UpsertContentAsync(portfolioId, "hero", "default", new
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
        await ctx.UpsertContentAsync(portfolioId, "about", "default", new
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
        await ctx.UpsertContentAsync(portfolioId, "case-studies", "default", new
        {
            preTitle = "What I bring to the table",
            title = "Case Studies",
            studies = new[]
            {
                new { number = "01", title = "I develop brands that earn a competitive advantage", description = "With the collaboration of various agencies, graphic designers, and web developers, I directed the creation of successful brands for 5/ten Management & Ginkgo Residential.", imageUrl = "/images/brandcasestudy.jpg", linkUrl = "/case-study/5ten", linkText = "view 5/ten case study" },
                new { number = "02", title = "Create engaging experiences", description = "Getting to know and understanding my audience allows me to draw inspiration from their daily lives to execute an engaging living experience.", imageUrl = "/images/experiencecase.jpg", linkUrl = "/case-study/experience", linkText = "view The Collective case study" },
                new { number = "03", title = "Digital marketing transformation and execution", description = "I believe in data-driven marketing insights that innovate go-to-market campaigns to drive growth.", imageUrl = "/images/hubsmartphone.jpg", linkUrl = "/case-study/digital-marketing", linkText = "view my digital marketing case studies" },
                new { number = "04", title = "Focused on creating value", description = "I have a talent for managing resources, creating agile operating procedures, and developing individuals.", imageUrl = "/images/valuethumb.jpg", linkUrl = "/case-study/value", linkText = "view how i create value" }
            }
        });

        // Portfolio Gallery
        await ctx.UpsertContentAsync(portfolioId, "portfolio", "default", new
        {
            preTitle = "My Work",
            title = "Select Portfolio Projects",
            categories = new[]
            {
                new { title = "Web Development", subtitle = "corporate, multifamily, commercial", thumbnailUrl = "/images/ginko.jpg", galleryImages = new[] { new { url = "/images/ginkgo/1 Landing.JPG" }, new { url = "/images/ginkgo/2 Properties.JPG" } } },
                new { title = "Digital Media", subtitle = "SOCIAL, EMAIL, VIDEO & PHOTOGRAPHY", thumbnailUrl = "/images/eblast.jpg", galleryImages = new[] { new { url = "/images/digitalmedia/Collective - eblast-01.jpg" } } },
                new { title = "Marketing Campaigns", subtitle = "connecting with the customer", thumbnailUrl = "/images/digimark.jpg", galleryImages = new[] { new { url = "/images/marketingcampaign/ginkgogreen.JPG" } } },
                new { title = "Marketing Collateral", subtitle = "branding", thumbnailUrl = "/images/brandguide.jpg", galleryImages = new[] { new { url = "/images/marketingcoll/brand guide.JPG" } } }
            }
        });

        // Footer
        await ctx.UpsertContentAsync(portfolioId, "footer", "default", new
        {
            logoUrl = "/images/logo.png",
            thankYouMessage = "Thank you for looking through my portfolio",
            linkedInUrl = "https://www.linkedin.com/in/jessica-m-sutherland-9891661a/",
            copyright = "© 2024 jessicasutherland.me",
            email = "jessutherland@hotmail.com"
        });

        // Case Study Pages
        await ctx.UpsertContentAsync(portfolioId, "case-study-page", "5ten", new
        {
            slug = "5ten",
            title = "Jessica Sutherland Portfolio - 5/ten management case study",
            headerTitle = "5/ten Case Study",
            headerDescription = "5/ten Management was getting underway when I joined the firm in 2018. The goal was to build a brand identity that distinguished 5/ten as a management firm yet remained connected with their affiliate Ram Realty Advisors.",
            headerBackgroundClass = "fivetenbg",
            sections = new[]
            {
                new { heading = "Developed and implemented the creative vision", content = "I led the planning, procurement, and execution of all tasks within the branding process.", imageUrl = "/images/fivetencase/web-12.JPG", imagePosition = "right" },
                new { heading = "The identity for 5/ten Management was created", content = "Having a defined brand led to an immediate positive impact on current associates.", imageUrl = "/images/fivetencase/5ten-visual-language.JPG", imagePosition = "left" }
            },
            valueBoxes = Array.Empty<object>()
        });

        await ctx.UpsertContentAsync(portfolioId, "case-study-page", "experience", new
        {
            slug = "experience",
            title = "Jessica Sutherland Portfolio - The Collective case study",
            headerTitle = "The Collective Case Study",
            headerDescription = "The Collective was a new development comprised of multi-family residential units and retail space located adjacent to the NoDa and Villa Heights neighborhoods in Charlotte, NC.",
            headerBackgroundClass = "experiencebg",
            sections = new[]
            {
                new { heading = "Pulling inspiration from the deep connection NoDa has to the arts", content = "The marketing approach emphasized art through both design and community.", imageUrl = "/images/wallnoda.jpg", imagePosition = "right" },
                new { heading = "Artist in Residence", content = "Bringing the Artist in Residence (AIR) project to life at The Collective is my favorite project to date.", imageUrl = "/images/airs2.jpg", imagePosition = "left" }
            },
            valueBoxes = Array.Empty<object>()
        });

        await ctx.UpsertContentAsync(portfolioId, "case-study-page", "digital-marketing", new
        {
            slug = "digital-marketing",
            title = "Jessica Sutherland Portfolio - digital marketing case study",
            headerTitle = "Digital Marketing Case Studies",
            headerDescription = "I believe in data-driven marketing insights that innovate go-to-market campaigns to drive growth.",
            headerBackgroundClass = "digitalmarketingbg",
            sections = new[]
            {
                new { heading = "Websites", content = "I've led the strategic direction for over 50 websites.", imageUrl = "/images/devices.jpg", imagePosition = "right" },
                new { heading = "Social Media Marketing", content = "I've led the company-wide implementation of social media management software.", imageUrl = "/images/socialmarketing.jpg", imagePosition = "left" }
            },
            valueBoxes = Array.Empty<object>()
        });

        await ctx.UpsertContentAsync(portfolioId, "case-study-page", "value", new
        {
            slug = "value",
            title = "Jessica Sutherland Portfolio - Value proposition",
            headerTitle = "Focused on creating value",
            headerDescription = "I have a talent for managing resources, creating agile operating procedures, and developing individuals.",
            headerBackgroundClass = "valuebg",
            sections = new[]
            {
                new { heading = "A reputation for providing solutions that positively impact revenue and growth", content = "Adjacent are a few concrete examples of the value I provide.", imageUrl = "/images/jessicasutherlandblackjacket.jpg", imagePosition = "left" }
            },
            valueBoxes = new[]
            {
                new { icon = "/images/value0.png", title = "Saved $200K+", description = "I updated the portfolio media buy for 5/ten Management, saving the firm around $200,000 in yearly advertising expenses." },
                new { icon = "/images/service1.svg", title = "Reduced costs by $25K", description = "I restructured the call center and lead-tracking platform package for Ginkgo Residential." }
            }
        });

        await ctx.UpsertContentAsync(portfolioId, "case-study-page", "ginkgo", new
        {
            slug = "ginkgo",
            title = "Jessica Sutherland Portfolio - Ginko Residential case study",
            headerTitle = "Ginkgo Case Study",
            headerDescription = "Ginkgo Residential was an established property management firm; however, the company's vision and the mission had evolved.",
            headerBackgroundClass = "ginkobg",
            sections = new[]
            {
                new { heading = "Rebrand of over 30 assets throughout the Southeast", content = "I led the rebranding efforts which included new logos, color palettes, collateral, signage, websites, digital media, and more.", imageUrl = "/images/ginkgo case/ginkgomobile.jpg", imagePosition = "right" },
                new { heading = "A unified brand identity", content = "All assets embodied the Ginkgo brand.", imageUrl = "/images/ginkotablet.jpg", imagePosition = "left" }
            },
            valueBoxes = Array.Empty<object>()
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.JessicaPortfolioId;

        // Delete content first
        await ctx.DeleteContentAsync(portfolioId, "case-study-page", "ginkgo");
        await ctx.DeleteContentAsync(portfolioId, "case-study-page", "value");
        await ctx.DeleteContentAsync(portfolioId, "case-study-page", "digital-marketing");
        await ctx.DeleteContentAsync(portfolioId, "case-study-page", "experience");
        await ctx.DeleteContentAsync(portfolioId, "case-study-page", "5ten");
        await ctx.DeleteContentAsync(portfolioId, "footer", "default");
        await ctx.DeleteContentAsync(portfolioId, "portfolio", "default");
        await ctx.DeleteContentAsync(portfolioId, "case-studies", "default");
        await ctx.DeleteContentAsync(portfolioId, "about", "default");
        await ctx.DeleteContentAsync(portfolioId, "hero", "default");
        await ctx.DeleteContentAsync(portfolioId, "navigation", "default");
        await ctx.DeleteContentAsync(portfolioId, "site-config", "default");

        // Then delete definitions
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "case-study-page");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "footer");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "navigation");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "portfolio");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "case-studies");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "about");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "hero");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "site-config");

        await ctx.SaveChangesAsync();
    }
}
