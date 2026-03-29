namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions and seeds all content for OpsBlueprint portfolio.
/// OpsBlueprint is a single-page workflow automation consulting site with 11 sections:
/// Navbar, Hero, Problem, Solution, Services, HowItWorks, Testimonials, About, LeadCapture, CTA, Footer.
/// </summary>
public class _20260328000000_OpsBlueprintEntityDefinitionsAndContent : ContentMigration
{
    public override string Description => "Create entity definitions and content for OpsBlueprint portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.OpsBlueprintPortfolioId;

        // ──────────────────────────────────────────────────
        // ENTITY DEFINITIONS
        // ──────────────────────────────────────────────────

        // Site Config
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "site-config", def => def
            .DisplayName("Site Configuration")
            .Description("Global site settings including brand info and contact details")
            .Icon("settings")
            .Category("Settings")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("brandName").Type("string").Required().Label("Brand Name"))
            .AddAttribute(a => a.Name("brandHighlight").Type("string").Label("Brand Name Highlight"))
            .AddAttribute(a => a.Name("logoSrc").Type("string").Label("Logo Image URL"))
            .AddAttribute(a => a.Name("logoAlt").Type("string").Label("Logo Alt Text"))
            .AddAttribute(a => a.Name("contactEmail").Type("string").Required().Label("Contact Email")));

        // Navigation
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "navigation", def => def
            .DisplayName("Navigation")
            .Description("Site navigation header with links and CTA")
            .Icon("menu")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("links").Type("array").Required().Label("Navigation Links")
                .Children(c => c
                    .Add(a => a.Name("label").Type("string").Required().Label("Label"))
                    .Add(a => a.Name("href").Type("string").Required().Label("Link Href"))))
            .AddAttribute(a => a.Name("ctaText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaLink").Type("string").Label("CTA Button Link")));

        // Hero Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "hero", def => def
            .DisplayName("Hero Section")
            .Description("Main hero banner with headline, CTA, and trust indicators")
            .Icon("star")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("badgeText").Type("string").Label("Badge Text"))
            .AddAttribute(a => a.Name("headingLine1").Type("string").Required().Label("Heading Line 1"))
            .AddAttribute(a => a.Name("headingHighlight").Type("string").Required().Label("Heading Highlight Word"))
            .AddAttribute(a => a.Name("headingLine2").Type("string").Required().Label("Heading Line 2"))
            .AddAttribute(a => a.Name("subheading").Type("text").Required().Label("Subheading"))
            .AddAttribute(a => a.Name("trustIndicators").Type("array").Label("Trust Indicators")
                .Children(c => c
                    .Add(a => a.Name("text").Type("string").Required().Label("Text"))))
            .AddAttribute(a => a.Name("primaryCtaText").Type("string").Label("Primary CTA Text"))
            .AddAttribute(a => a.Name("primaryCtaLink").Type("string").Label("Primary CTA Link"))
            .AddAttribute(a => a.Name("secondaryCtaText").Type("string").Label("Secondary CTA Text"))
            .AddAttribute(a => a.Name("secondaryCtaLink").Type("string").Label("Secondary CTA Link"))
            .AddAttribute(a => a.Name("heroImage").Type("object").Label("Hero Image")
                .Children(c => c
                    .Add(a => a.Name("src").Type("string").Required().Label("Image URL"))
                    .Add(a => a.Name("alt").Type("string").Label("Alt Text"))))
            .AddAttribute(a => a.Name("floatingStatValue").Type("string").Label("Floating Stat Value"))
            .AddAttribute(a => a.Name("floatingStatDescription").Type("string").Label("Floating Stat Description"))
            .AddAttribute(a => a.Name("floatingBadgeText").Type("string").Label("Floating Badge Text")));

        // Problem Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "problem", def => def
            .DisplayName("Problem Section")
            .Description("Pain points that resonate with target audience")
            .Icon("error")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subheading").Type("text").Label("Subheading"))
            .AddAttribute(a => a.Name("problems").Type("array").Required().Label("Problem Items")
                .Children(c => c
                    .Add(a => a.Name("title").Type("string").Required().Label("Title"))
                    .Add(a => a.Name("description").Type("text").Required().Label("Description"))
                    .Add(a => a.Name("iconId").Type("string").Label("Icon Identifier")))));

        // Solution Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "solution", def => def
            .DisplayName("Solution Section")
            .Description("How the service connects existing tools into automated pipelines")
            .Icon("lightbulb")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subheading").Type("text").Label("Subheading"))
            .AddAttribute(a => a.Name("steps").Type("array").Required().Label("Pipeline Steps")
                .Children(c => c
                    .Add(a => a.Name("label").Type("string").Required().Label("Step Label"))
                    .Add(a => a.Name("description").Type("text").Required().Label("Description"))
                    .Add(a => a.Name("colorClass").Type("string").Label("Color CSS Class")))));

        // Services Section (pricing tiers)
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "services", def => def
            .DisplayName("Services / Pricing")
            .Description("Service packages with pricing tiers and features")
            .Icon("payments")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subheading").Type("text").Label("Subheading"))
            .AddAttribute(a => a.Name("featuredBadgeText").Type("string").Label("Featured Badge Text"))
            .AddAttribute(a => a.Name("packages").Type("array").Required().Label("Service Packages")
                .Children(c => c
                    .Add(a => a.Name("tier").Type("string").Required().Label("Tier Name"))
                    .Add(a => a.Name("name").Type("string").Required().Label("Package Name"))
                    .Add(a => a.Name("price").Type("string").Required().Label("Price Range"))
                    .Add(a => a.Name("description").Type("text").Required().Label("Description"))
                    .Add(a => a.Name("badge").Type("string").Label("Badge Variant"))
                    .Add(a => a.Name("featured").Type("boolean").Label("Is Featured"))
                    .Add(a => a.Name("features").Type("array").Label("Features")))));

        // How It Works Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "how-it-works", def => def
            .DisplayName("How It Works")
            .Description("Step-by-step process explanation")
            .Icon("route")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subheading").Type("text").Label("Subheading"))
            .AddAttribute(a => a.Name("steps").Type("array").Required().Label("Process Steps")
                .Children(c => c
                    .Add(a => a.Name("number").Type("string").Required().Label("Step Number"))
                    .Add(a => a.Name("title").Type("string").Required().Label("Title"))
                    .Add(a => a.Name("description").Type("text").Required().Label("Description"))
                    .Add(a => a.Name("iconId").Type("string").Label("Icon Identifier")))));

        // Testimonials Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "testimonials", def => def
            .DisplayName("Testimonials")
            .Description("Client testimonials with quotes and metrics")
            .Icon("format_quote")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subheading").Type("text").Label("Subheading"))
            .AddAttribute(a => a.Name("testimonials").Type("array").Required().Label("Testimonials")
                .Children(c => c
                    .Add(a => a.Name("name").Type("string").Required().Label("Client Name"))
                    .Add(a => a.Name("title").Type("string").Required().Label("Client Title"))
                    .Add(a => a.Name("metric").Type("string").Label("Key Metric"))
                    .Add(a => a.Name("photo").Type("string").Label("Photo URL"))
                    .Add(a => a.Name("quote").Type("text").Required().Label("Quote")))));

        // About Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "about", def => def
            .DisplayName("About Section")
            .Description("About the founder with bio, credentials, and highlights")
            .Icon("person")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("eyebrow").Type("string").Label("Eyebrow / Kicker"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("bioParagraph1").Type("text").Required().Label("Bio Paragraph 1"))
            .AddAttribute(a => a.Name("bioParagraph2").Type("text").Label("Bio Paragraph 2"))
            .AddAttribute(a => a.Name("linkedinUrl").Type("string").Label("LinkedIn URL"))
            .AddAttribute(a => a.Name("linkedinLabel").Type("string").Label("LinkedIn Link Text"))
            .AddAttribute(a => a.Name("portfolioUrl").Type("string").Label("Portfolio URL"))
            .AddAttribute(a => a.Name("portfolioLabel").Type("string").Label("Portfolio Link Text"))
            .AddAttribute(a => a.Name("avatarInitials").Type("string").Label("Avatar Initials"))
            .AddAttribute(a => a.Name("cardName").Type("string").Label("Card Name"))
            .AddAttribute(a => a.Name("cardTitle").Type("string").Label("Card Title"))
            .AddAttribute(a => a.Name("cardClosingQuote").Type("text").Label("Card Closing Quote"))
            .AddAttribute(a => a.Name("highlights").Type("array").Label("Highlights")
                .Children(c => c
                    .Add(a => a.Name("label").Type("string").Required().Label("Label"))
                    .Add(a => a.Name("description").Type("string").Label("Description")))));

        // Lead Capture Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "lead-capture", def => def
            .DisplayName("Lead Capture Form")
            .Description("Lead generation form with industry selector and messaging")
            .Icon("contact_page")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subheading").Type("text").Label("Subheading"))
            .AddAttribute(a => a.Name("nameLabel").Type("string").Label("Name Field Label"))
            .AddAttribute(a => a.Name("namePlaceholder").Type("string").Label("Name Placeholder"))
            .AddAttribute(a => a.Name("emailLabel").Type("string").Label("Email Field Label"))
            .AddAttribute(a => a.Name("emailPlaceholder").Type("string").Label("Email Placeholder"))
            .AddAttribute(a => a.Name("companyLabel").Type("string").Label("Company Field Label"))
            .AddAttribute(a => a.Name("companyPlaceholder").Type("string").Label("Company Placeholder"))
            .AddAttribute(a => a.Name("industryLabel").Type("string").Label("Industry Field Label"))
            .AddAttribute(a => a.Name("problemLabel").Type("string").Label("Problem Field Label"))
            .AddAttribute(a => a.Name("problemPlaceholder").Type("string").Label("Problem Placeholder"))
            .AddAttribute(a => a.Name("submitButtonText").Type("string").Label("Submit Button Text"))
            .AddAttribute(a => a.Name("submittingButtonText").Type("string").Label("Submitting Button Text"))
            .AddAttribute(a => a.Name("privacyText").Type("string").Label("Privacy / Trust Line"))
            .AddAttribute(a => a.Name("successHeading").Type("string").Label("Success Heading"))
            .AddAttribute(a => a.Name("successMessage").Type("text").Label("Success Message"))
            .AddAttribute(a => a.Name("errorMessage").Type("string").Label("Error Fallback Message"))
            .AddAttribute(a => a.Name("apiEndpoint").Type("string").Label("Form API Endpoint"))
            .AddAttribute(a => a.Name("industries").Type("array").Label("Industry Options")
                .Children(c => c
                    .Add(a => a.Name("value").Type("string").Required().Label("Value"))
                    .Add(a => a.Name("label").Type("string").Required().Label("Display Label")))));

        // CTA Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "cta", def => def
            .DisplayName("CTA Section")
            .Description("Final call-to-action banner before footer")
            .Icon("campaign")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subheading").Type("text").Label("Subheading"))
            .AddAttribute(a => a.Name("buttonText").Type("string").Label("Button Text"))
            .AddAttribute(a => a.Name("buttonLink").Type("string").Label("Button Link")));

        // Footer
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "footer", def => def
            .DisplayName("Footer")
            .Description("Site footer with tagline, service links, and contact info")
            .Icon("bottom_navigation")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("tagline").Type("text").Label("Brand Tagline"))
            .AddAttribute(a => a.Name("servicesHeading").Type("string").Label("Services Column Heading"))
            .AddAttribute(a => a.Name("serviceLinks").Type("array").Label("Service Links")
                .Children(c => c
                    .Add(a => a.Name("text").Type("string").Required().Label("Link Text"))
                    .Add(a => a.Name("href").Type("string").Required().Label("Link Href"))))
            .AddAttribute(a => a.Name("contactHeading").Type("string").Label("Contact Column Heading"))
            .AddAttribute(a => a.Name("contactLinks").Type("array").Label("Contact Links")
                .Children(c => c
                    .Add(a => a.Name("text").Type("string").Required().Label("Link Text"))
                    .Add(a => a.Name("href").Type("string").Required().Label("Link Href"))))
            .AddAttribute(a => a.Name("copyrightTemplate").Type("string").Label("Copyright Template")));

        await ctx.SaveChangesAsync();

        // ──────────────────────────────────────────────────
        // CONTENT SEEDING
        // ──────────────────────────────────────────────────

        // Site Config
        await ctx.UpsertContentAsync(portfolioId, "site-config", "default", new
        {
            brandName = "Ops",
            brandHighlight = "Blueprint",
            logoSrc = "/logo.svg",
            logoAlt = "OpsBlueprint logo",
            contactEmail = "fxvarga@gmail.com"
        });

        // Navigation
        await ctx.UpsertContentAsync(portfolioId, "navigation", "default", new
        {
            links = new[]
            {
                new { label = "Services", href = "#services" },
                new { label = "How It Works", href = "#how-it-works" },
                new { label = "Testimonials", href = "#testimonials" },
                new { label = "About", href = "#about" }
            },
            ctaText = "Get Started",
            ctaLink = "#lead-form"
        });

        // Hero Section
        await ctx.UpsertContentAsync(portfolioId, "hero", "default", new
        {
            badgeText = "Automation for Small Businesses",
            headingLine1 = "Stop Doing",
            headingHighlight = "Everything",
            headingLine2 = "Yourself",
            subheading = "You started your business to do what you love \u2014 not to spend nights on data entry, chasing emails, and building spreadsheets. We set up automations that handle the busywork, so you can get back to running your business.",
            trustIndicators = new[]
            {
                new { text = "Built for small teams" },
                new { text = "Up and running in weeks" }
            },
            primaryCtaText = "Get a Free Consultation",
            primaryCtaLink = "#lead-form",
            secondaryCtaText = "See How It Works",
            secondaryCtaLink = "#how-it-works",
            heroImage = new
            {
                src = "/images/hero-workspace.jpg",
                alt = "Team collaborating on workflow automation in a modern office"
            },
            floatingStatValue = "20+ hrs saved",
            floatingStatDescription = "per week, per business",
            floatingBadgeText = "AI-Powered"
        });

        // Problem Section
        await ctx.UpsertContentAsync(portfolioId, "problem", "default", new
        {
            heading = "Running a small business shouldn\u2019t mean doing everything manually",
            subheading = "If you\u2019re wearing every hat in your business, these probably hit close to home.",
            problems = new[]
            {
                new
                {
                    title = "You\u2019re the owner AND the admin",
                    description = "Copying data between spreadsheets, updating CRMs, chasing invoices \u2014 you didn\u2019t start a business to do data entry all day.",
                    iconId = "clipboard"
                },
                new
                {
                    title = "Leads slip through the cracks",
                    description = "Without a dedicated sales team, inquiries pile up in your inbox. By the time you reply, the prospect has moved on.",
                    iconId = "funnel"
                },
                new
                {
                    title = "Quotes and proposals eat up your evenings",
                    description = "Building each proposal from scratch takes time you don\u2019t have. It\u2019s after-hours work that delays your pipeline.",
                    iconId = "clock"
                },
                new
                {
                    title = "You can\u2019t afford a full IT team",
                    description = "Hiring developers or an operations manager isn\u2019t in the budget yet, but you\u2019ve outgrown sticky notes and spreadsheets.",
                    iconId = "calculator"
                }
            }
        });

        // Solution Section
        await ctx.UpsertContentAsync(portfolioId, "solution", "default", new
        {
            heading = "We connect the tools you already use \u2014 so they work for you",
            subheading = "No ripping out what works. We link your email, CRM, spreadsheets, and forms into automated pipelines that run 24/7 \u2014 even when you\u2019re off the clock.",
            steps = new[]
            {
                new { label = "Intake", description = "Leads, emails, and customer requests flow into one place automatically.", colorClass = "bg-primary-500" },
                new { label = "Automation", description = "Smart workflows sort, route, and act on each item \u2014 no manual steps.", colorClass = "bg-primary-600" },
                new { label = "Tracking", description = "You see everything that happened, in real time, from your phone or laptop.", colorClass = "bg-primary-700" }
            }
        });

        // Services Section (pricing tiers)
        await ctx.UpsertContentAsync(portfolioId, "services", "default", new
        {
            heading = "Packages That Fit a Small Business Budget",
            subheading = "Every dollar counts when you\u2019re growing. Pick the level that makes sense for where you are \u2014 each one pays for itself in time saved.",
            featuredBadgeText = "Most Popular",
            packages = new[]
            {
                new
                {
                    tier = "Starter",
                    name = "Workflow Audit",
                    price = "$500 - $1,500",
                    description = "We map how your business actually runs today, find the time-wasters, and hand you a clear plan for what to automate first.",
                    badge = "gray",
                    featured = false,
                    features = new[]
                    {
                        "Process mapping & documentation",
                        "Bottleneck identification",
                        "Tool & integration assessment",
                        "Prioritized automation roadmap",
                        "ROI projections for your budget"
                    }
                },
                new
                {
                    tier = "Professional",
                    name = "Core Automation",
                    price = "$5,000 - $15,000",
                    description = "We build the automations that give you your time back \u2014 lead follow-ups, invoicing, data syncing \u2014 so you can focus on customers.",
                    badge = "blue",
                    featured = true,
                    features = new[]
                    {
                        "Everything in Workflow Audit",
                        "Custom n8n/Zapier workflows",
                        "CRM & email integration",
                        "Lead intake automation",
                        "Proposal generation pipeline",
                        "30-day post-launch support"
                    }
                },
                new
                {
                    tier = "Growth",
                    name = "Advanced Systems",
                    price = "$15,000 - $40,000",
                    description = "For growing businesses ready to scale operations \u2014 AI-powered triage, multi-step approvals, and dashboards that keep you in control.",
                    badge = "green",
                    featured = false,
                    features = new[]
                    {
                        "Everything in Core Automation",
                        "AI-powered email triage",
                        "Multi-step approval workflows",
                        "Custom reporting dashboards",
                        "API integrations & webhooks",
                        "Dedicated support & training"
                    }
                }
            }
        });

        // How It Works Section
        await ctx.UpsertContentAsync(portfolioId, "how-it-works", "default", new
        {
            heading = "How It Works",
            subheading = "A simple, no-nonsense process designed for busy owners \u2014 not months of meetings.",
            steps = new[]
            {
                new
                {
                    number = "01",
                    title = "Analyze",
                    description = "We sit down with you (not a committee) and walk through how your business actually runs \u2014 finding the tasks that eat up your time and could be automated.",
                    iconId = "magnifier"
                },
                new
                {
                    number = "02",
                    title = "Design",
                    description = "We pick the right tools for your budget (n8n, Zapier, or custom), sketch the workflows, and show you exactly what you\u2019ll save before we build anything.",
                    iconId = "pencil-ruler"
                },
                new
                {
                    number = "03",
                    title = "Implement",
                    description = "We build, test, and launch your automations \u2014 then walk you through everything and stick around for 30 days to make sure it all runs smoothly.",
                    iconId = "rocket"
                }
            }
        });

        // Testimonials Section
        await ctx.UpsertContentAsync(portfolioId, "testimonials", "default", new
        {
            heading = "What Our Clients Say",
            subheading = "Real results from small business owners who stopped doing everything manually.",
            testimonials = new[]
            {
                new
                {
                    name = "Sarah Mitchell",
                    title = "Owner, Horizon Events (12 employees)",
                    metric = "3 hrs/day saved",
                    photo = "/images/testimonial-1.jpg",
                    quote = "I was spending the first three hours of every morning sorting emails and updating our booking spreadsheet. Fernando automated the whole thing in two weeks. Now leads land in our CRM, clients get an instant reply, and I actually start my day with coffee instead of data entry."
                },
                new
                {
                    name = "Marcus Chen",
                    title = "Founder, Pacific Coast Catering (8 employees)",
                    metric = "100% ROI in 30 days",
                    photo = "/images/testimonial-2.jpg",
                    quote = "We tried setting up Zapier ourselves and gave up after a weekend. Fernando came in, mapped our entire order-to-invoice flow, and by week three we had zero manual data entry between our CRM and QuickBooks. The project paid for itself in the first month."
                },
                new
                {
                    name = "Elena Rodriguez",
                    title = "Co-Owner, Clearview Property Group (5 employees)",
                    metric = "45 min \u2192 seconds",
                    photo = "/images/testimonial-3.jpg",
                    quote = "As a two-person sales team, we couldn\u2019t afford to spend 45 minutes building each proposal by hand. Now our intake form triggers a branded proposal automatically \u2014 accurate, professional, and delivered in seconds. It\u2019s like having an extra employee."
                }
            }
        });

        // About Section
        await ctx.UpsertContentAsync(portfolioId, "about", "default", new
        {
            eyebrow = "About the Founder",
            heading = "Built by an engineer who gets small business",
            bioParagraph1 = "I\u2019m Fernando Vargas, a Senior Full-Stack Engineer with 12+ years of experience building systems across finance, healthcare, and service businesses. I\u2019ve watched small business owners spend their nights on work that a well-built automation could handle in seconds.",
            bioParagraph2 = "OpsBlueprint exists because I kept seeing the same pattern: talented owners stuck doing admin work instead of growing their business. I bring the same caliber of automation that large companies use, packaged and priced for businesses with 5 to 50 people.",
            linkedinUrl = "https://www.linkedin.com/in/fernando-vargas-16234254/",
            linkedinLabel = "LinkedIn",
            portfolioUrl = "https://fernando-vargas.com",
            portfolioLabel = "Portfolio",
            avatarInitials = "FV",
            cardName = "Fernando Vargas",
            cardTitle = "Senior Full-Stack Engineer",
            cardClosingQuote = "I built OpsBlueprint because small business owners deserve the same automation power that big companies have \u2014 without the big company price tag.",
            highlights = new[]
            {
                new { label = "12+ Years", description = "Full-stack engineering experience" },
                new { label = "Small Business Focus", description = "Built for teams of 5\u201350 people" },
                new { label = "AI + Automation", description = "Modern tools, practical results" }
            }
        });

        // Lead Capture Section
        await ctx.UpsertContentAsync(portfolioId, "lead-capture", "default", new
        {
            heading = "Tell Us What\u2019s Eating Up Your Time",
            subheading = "Describe the task you wish you could stop doing. We\u2019ll respond with a free analysis and a plan to automate it \u2014 no strings attached.",
            nameLabel = "Full Name",
            namePlaceholder = "Jane Smith",
            emailLabel = "Email",
            emailPlaceholder = "jane@mybusiness.com",
            companyLabel = "Company",
            companyPlaceholder = "My Business LLC",
            industryLabel = "Industry",
            problemLabel = "What task do you wish you could stop doing?",
            problemPlaceholder = "e.g., I spend 2 hours every morning manually entering orders from email into our spreadsheet...",
            submitButtonText = "Get Your Free Consultation",
            submittingButtonText = "Submitting...",
            privacyText = "No spam. No pressure. Just a free look at how we can save you time.",
            successHeading = "Thank you!",
            successMessage = "We\u2019ve received your request and will reach out within 24 hours to discuss how we can help your business run on autopilot.",
            errorMessage = "Failed to submit. Please try again.",
            apiEndpoint = "/api/leads",
            industries = new[]
            {
                new { value = "catering", label = "Catering & Food Service" },
                new { value = "events", label = "Event Planning & Management" },
                new { value = "accounting", label = "Accounting & Finance" },
                new { value = "property", label = "Property Management" },
                new { value = "healthcare", label = "Healthcare Services" },
                new { value = "professional", label = "Professional Services" },
                new { value = "retail", label = "Retail & E-Commerce" },
                new { value = "construction", label = "Construction & Trades" },
                new { value = "other", label = "Other" }
            }
        });

        // CTA Section
        await ctx.UpsertContentAsync(portfolioId, "cta", "default", new
        {
            heading = "Ready to stop working IN your business and start working ON it?",
            subheading = "Small business owners like you are reclaiming 20+ hours a week by letting automations handle the repetitive stuff.",
            buttonText = "Start Your Free Consultation",
            buttonLink = "#lead-form"
        });

        // Footer
        await ctx.UpsertContentAsync(portfolioId, "footer", "default", new
        {
            tagline = "Workflow automation built for small businesses. We handle the busywork so you can focus on your customers.",
            servicesHeading = "Services",
            serviceLinks = new[]
            {
                new { text = "Workflow Audit", href = "#services" },
                new { text = "Core Automation", href = "#services" },
                new { text = "Advanced Systems", href = "#services" }
            },
            contactHeading = "Get In Touch",
            contactLinks = new[]
            {
                new { text = "Request a Consultation", href = "#lead-form" },
                new { text = "fxvarga@gmail.com", href = "mailto:fxvarga@gmail.com" }
            },
            copyrightTemplate = "\u00a9 {year} OpsBlueprint. All rights reserved."
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.OpsBlueprintPortfolioId;

        // Delete content first
        await ctx.DeleteContentAsync(portfolioId, "footer", "default");
        await ctx.DeleteContentAsync(portfolioId, "cta", "default");
        await ctx.DeleteContentAsync(portfolioId, "lead-capture", "default");
        await ctx.DeleteContentAsync(portfolioId, "about", "default");
        await ctx.DeleteContentAsync(portfolioId, "testimonials", "default");
        await ctx.DeleteContentAsync(portfolioId, "how-it-works", "default");
        await ctx.DeleteContentAsync(portfolioId, "services", "default");
        await ctx.DeleteContentAsync(portfolioId, "solution", "default");
        await ctx.DeleteContentAsync(portfolioId, "problem", "default");
        await ctx.DeleteContentAsync(portfolioId, "hero", "default");
        await ctx.DeleteContentAsync(portfolioId, "navigation", "default");
        await ctx.DeleteContentAsync(portfolioId, "site-config", "default");

        // Then delete definitions
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "footer");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "cta");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "lead-capture");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "about");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "testimonials");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "how-it-works");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "services");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "solution");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "problem");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "hero");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "navigation");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "site-config");

        await ctx.SaveChangesAsync();
    }
}
