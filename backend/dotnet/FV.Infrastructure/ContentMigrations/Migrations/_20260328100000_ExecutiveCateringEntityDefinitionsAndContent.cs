namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions and seeds all content for Executive Catering CT main-site.
/// Executive Catering is a multi-page static site with:
///   - Landing page: Hero, About/Hello, Services, Capabilities, Parallax breaks, Footer
///   - Inquiry landing: Type selector (Corporate vs Social)
///   - Corporate inquiry form: 12-step Typeform-style form
///   - Social inquiry form: 13-step Typeform-style form
/// </summary>
public class _20260328100000_ExecutiveCateringEntityDefinitionsAndContent : ContentMigration
{
    public override string Description => "Create entity definitions and content for Executive Catering CT main-site";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.ExecutiveCateringPortfolioId;

        // ──────────────────────────────────────────────────
        // ENTITY DEFINITIONS
        // ──────────────────────────────────────────────────

        // Site Config
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "site-config", def => def
            .DisplayName("Site Configuration")
            .Description("Global site settings including brand info, contact details, and SEO metadata")
            .Icon("settings")
            .Category("Settings")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("brandName").Type("string").Required().Label("Brand Name"))
            .AddAttribute(a => a.Name("siteTitle").Type("string").Label("Site Title (HTML <title>)"))
            .AddAttribute(a => a.Name("siteDescription").Type("text").Label("Site Meta Description"))
            .AddAttribute(a => a.Name("logoSrc").Type("string").Label("Logo Image URL"))
            .AddAttribute(a => a.Name("logoAlt").Type("string").Label("Logo Alt Text"))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Phone Number"))
            .AddAttribute(a => a.Name("phoneHref").Type("string").Label("Phone href (tel:...)"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Email Address"))
            .AddAttribute(a => a.Name("location").Type("string").Label("Location"))
            .AddAttribute(a => a.Name("hours").Type("text").Label("Business Hours"))
            .AddAttribute(a => a.Name("analyticsId").Type("string").Label("Analytics Domain")));

        // Navigation
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "navigation", def => def
            .DisplayName("Navigation")
            .Description("Site navigation bar with links and CTA button")
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
            .Description("Main hero banner with tagline, subtitle, and CTA")
            .Icon("star")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("tagline").Type("string").Required().Label("Tagline"))
            .AddAttribute(a => a.Name("subtitle").Type("text").Required().Label("Subtitle"))
            .AddAttribute(a => a.Name("ctaText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaLink").Type("string").Label("CTA Button Link"))
            .AddAttribute(a => a.Name("backgroundImage").Type("string").Label("Background Image URL"))
            .AddAttribute(a => a.Name("scrollIndicatorText").Type("string").Label("Scroll Indicator Text")));

        // About / Hello Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "about", def => def
            .DisplayName("About / Hello Section")
            .Description("Hello section with introductory paragraphs and sidebar contact info")
            .Icon("person")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Section Heading"))
            .AddAttribute(a => a.Name("paragraphs").Type("array").Required().Label("Body Paragraphs")
                .Children(c => c
                    .Add(a => a.Name("text").Type("text").Required().Label("Paragraph Text"))))
            .AddAttribute(a => a.Name("sidebarHeading").Type("string").Label("Sidebar Heading")));

        // Parallax Breaks
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "parallax-break", def => def
            .DisplayName("Parallax Break")
            .Description("Full-width parallax image break with heading and subtext")
            .Icon("image")
            .Category("Sections")
            .IsCollection()
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("subtext").Type("string").Label("Subtext"))
            .AddAttribute(a => a.Name("backgroundImage").Type("string").Label("Background Image URL")));

        // Services Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "services", def => def
            .DisplayName("Services Section")
            .Description("What We Do section with intro, gallery images, and stat counters")
            .Icon("restaurant")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Section Heading"))
            .AddAttribute(a => a.Name("subtitle").Type("string").Label("Section Subtitle"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Intro Description"))
            .AddAttribute(a => a.Name("galleryImages").Type("array").Label("Gallery Images")
                .Children(c => c
                    .Add(a => a.Name("src").Type("string").Required().Label("Image URL"))
                    .Add(a => a.Name("alt").Type("string").Required().Label("Alt Text"))))
            .AddAttribute(a => a.Name("stats").Type("array").Label("Stat Counters")
                .Children(c => c
                    .Add(a => a.Name("count").Type("string").Required().Label("Count Value"))
                    .Add(a => a.Name("suffix").Type("string").Label("Count Suffix"))
                    .Add(a => a.Name("title").Type("string").Required().Label("Stat Title"))
                    .Add(a => a.Name("description").Type("text").Label("Stat Description")))));

        // Capabilities Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "capabilities", def => def
            .DisplayName("Capabilities Section")
            .Description("What We Bring section with capability cards and rotating event type text")
            .Icon("build")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Section Heading"))
            .AddAttribute(a => a.Name("subtitle").Type("string").Label("Section Subtitle"))
            .AddAttribute(a => a.Name("cards").Type("array").Required().Label("Capability Cards")
                .Children(c => c
                    .Add(a => a.Name("icon").Type("string").Label("Icon Character/Code"))
                    .Add(a => a.Name("title").Type("string").Required().Label("Card Title"))
                    .Add(a => a.Name("description").Type("text").Required().Label("Card Description"))))
            .AddAttribute(a => a.Name("rotatingPhrases").Type("array").Label("Rotating Event Type Phrases")
                .Children(c => c
                    .Add(a => a.Name("text").Type("string").Required().Label("Phrase")))));

        // Footer
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "footer", def => def
            .DisplayName("Footer")
            .Description("Site footer with CTA banner and copyright")
            .Icon("bottom_navigation")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("ctaHeading").Type("string").Label("CTA Heading"))
            .AddAttribute(a => a.Name("ctaSubtext").Type("string").Label("CTA Subtext"))
            .AddAttribute(a => a.Name("ctaButtonText").Type("string").Label("CTA Button Text"))
            .AddAttribute(a => a.Name("ctaButtonLink").Type("string").Label("CTA Button Link"))
            .AddAttribute(a => a.Name("copyrightTemplate").Type("string").Label("Copyright Text"))
            .AddAttribute(a => a.Name("builtByText").Type("string").Label("Built By Text"))
            .AddAttribute(a => a.Name("builtByUrl").Type("string").Label("Built By URL")));

        // Inquiry Landing Page
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "inquiry-landing", def => def
            .DisplayName("Inquiry Landing Page")
            .Description("Inquiry type selector page with corporate and social cards")
            .Icon("quiz")
            .Category("Pages")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("pageTitle").Type("string").Label("Page Title (HTML)"))
            .AddAttribute(a => a.Name("pageDescription").Type("text").Label("Page Meta Description"))
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Main Heading"))
            .AddAttribute(a => a.Name("subtitle").Type("string").Label("Subtitle"))
            .AddAttribute(a => a.Name("cards").Type("array").Required().Label("Inquiry Type Cards")
                .Children(c => c
                    .Add(a => a.Name("title").Type("string").Required().Label("Card Title"))
                    .Add(a => a.Name("description").Type("text").Required().Label("Card Description"))
                    .Add(a => a.Name("ctaText").Type("string").Required().Label("CTA Text"))
                    .Add(a => a.Name("href").Type("string").Required().Label("Link URL"))
                    .Add(a => a.Name("iconId").Type("string").Label("Icon Identifier"))))
            .AddAttribute(a => a.Name("helpText").Type("text").Label("Help / Fallback Text")));

        // Corporate Inquiry Form
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "corporate-inquiry", def => def
            .DisplayName("Corporate Inquiry Form")
            .Description("Multi-step corporate event inquiry form content and configuration")
            .Icon("business")
            .Category("Forms")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("pageTitle").Type("string").Label("Page Title (HTML)"))
            .AddAttribute(a => a.Name("pageDescription").Type("text").Label("Page Meta Description"))
            .AddAttribute(a => a.Name("welcomeHeading").Type("string").Required().Label("Welcome Heading"))
            .AddAttribute(a => a.Name("welcomeSubtext").Type("string").Label("Welcome Subtext"))
            .AddAttribute(a => a.Name("startButtonText").Type("string").Label("Start Button Text"))
            .AddAttribute(a => a.Name("steps").Type("array").Required().Label("Form Steps")
                .Children(c => c
                    .Add(a => a.Name("id").Type("string").Required().Label("Step ID"))
                    .Add(a => a.Name("question").Type("string").Required().Label("Question Text"))
                    .Add(a => a.Name("description").Type("string").Label("Help / Description Text"))
                    .Add(a => a.Name("fieldType").Type("string").Required().Label("Field Type (text/email/tel/date/choice/yesno/textarea)"))
                    .Add(a => a.Name("placeholder").Type("string").Label("Input Placeholder"))
                    .Add(a => a.Name("required").Type("boolean").Label("Is Required"))
                    .Add(a => a.Name("choices").Type("array").Label("Choice Options"))))
            .AddAttribute(a => a.Name("guestCountChoices").Type("array").Label("Guest Count Options")
                .Children(c => c
                    .Add(a => a.Name("value").Type("string").Required().Label("Value"))
                    .Add(a => a.Name("label").Type("string").Required().Label("Display Label"))))
            .AddAttribute(a => a.Name("thankYouHeading").Type("string").Label("Thank You Heading"))
            .AddAttribute(a => a.Name("thankYouMessage").Type("string").Label("Thank You Message"))
            .AddAttribute(a => a.Name("thankYouUrgent").Type("string").Label("Urgent Contact Text"))
            .AddAttribute(a => a.Name("backToHomeText").Type("string").Label("Back to Home Text"))
            .AddAttribute(a => a.Name("apiEndpoint").Type("string").Label("Form Submission API Endpoint")));

        // Social Inquiry Form
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "social-inquiry", def => def
            .DisplayName("Social Inquiry Form")
            .Description("Multi-step social/personal event inquiry form content and configuration")
            .Icon("celebration")
            .Category("Forms")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("pageTitle").Type("string").Label("Page Title (HTML)"))
            .AddAttribute(a => a.Name("pageDescription").Type("text").Label("Page Meta Description"))
            .AddAttribute(a => a.Name("welcomeHeading").Type("string").Required().Label("Welcome Heading"))
            .AddAttribute(a => a.Name("welcomeSubtext").Type("string").Label("Welcome Subtext"))
            .AddAttribute(a => a.Name("startButtonText").Type("string").Label("Start Button Text"))
            .AddAttribute(a => a.Name("eventTypeChoices").Type("array").Label("Event Type Options")
                .Children(c => c
                    .Add(a => a.Name("value").Type("string").Required().Label("Value"))
                    .Add(a => a.Name("label").Type("string").Required().Label("Display Label"))))
            .AddAttribute(a => a.Name("guestCountChoices").Type("array").Label("Guest Count Options")
                .Children(c => c
                    .Add(a => a.Name("value").Type("string").Required().Label("Value"))
                    .Add(a => a.Name("label").Type("string").Required().Label("Display Label"))))
            .AddAttribute(a => a.Name("steps").Type("array").Required().Label("Form Steps")
                .Children(c => c
                    .Add(a => a.Name("id").Type("string").Required().Label("Step ID"))
                    .Add(a => a.Name("question").Type("string").Required().Label("Question Text"))
                    .Add(a => a.Name("description").Type("string").Label("Help / Description Text"))
                    .Add(a => a.Name("fieldType").Type("string").Required().Label("Field Type"))
                    .Add(a => a.Name("placeholder").Type("string").Label("Input Placeholder"))
                    .Add(a => a.Name("required").Type("boolean").Label("Is Required"))))
            .AddAttribute(a => a.Name("thankYouHeading").Type("string").Label("Thank You Heading"))
            .AddAttribute(a => a.Name("thankYouMessage").Type("string").Label("Thank You Message"))
            .AddAttribute(a => a.Name("thankYouUrgent").Type("string").Label("Urgent Contact Text"))
            .AddAttribute(a => a.Name("backToHomeText").Type("string").Label("Back to Home Text"))
            .AddAttribute(a => a.Name("apiEndpoint").Type("string").Label("Form Submission API Endpoint")));

        await ctx.SaveChangesAsync();

        // ──────────────────────────────────────────────────
        // CONTENT SEEDING
        // ──────────────────────────────────────────────────

        // Site Config
        await ctx.UpsertContentAsync(portfolioId, "site-config", "default", new
        {
            brandName = "Executive Catering CT",
            siteTitle = "Executive Catering CT - Full-Service Catering in Connecticut",
            siteDescription = "Executive Catering CT provides full-service catering for weddings, corporate events, and private gatherings across Connecticut. We start with yes.",
            logoSrc = "../_shared/img/ecct-logo-final.png",
            logoAlt = "Executive Catering CT",
            phone = "(203) 555-1234",
            phoneHref = "tel:+12035551234",
            email = "info@executivecateringct.com",
            location = "Wallingford, Connecticut",
            hours = "Mon\u2013Fri: 9am \u2013 6pm\nSat: By Appointment\nSun: Closed",
            analyticsId = "executivecateringct.com"
        });

        // Navigation
        await ctx.UpsertContentAsync(portfolioId, "navigation", "default", new
        {
            links = new[]
            {
                new { label = "About", href = "#hello" },
                new { label = "Services", href = "#services" },
                new { label = "Our Space", href = "#capabilities" },
                new { label = "Contact", href = "#contact" }
            },
            ctaText = "Get A Quote",
            ctaLink = "inquiry/"
        });

        // Hero Section
        await ctx.UpsertContentAsync(portfolioId, "hero", "default", new
        {
            tagline = "We Start\nWith Yes",
            subtitle = "Full-service catering for weddings, corporate events, and private gatherings across Connecticut.",
            ctaText = "Discover More",
            ctaLink = "#hello",
            backgroundImage = "assets/img/hero-bg.jpg",
            scrollIndicatorText = "Scroll"
        });

        // About / Hello Section
        await ctx.UpsertContentAsync(portfolioId, "about", "default", new
        {
            heading = "Hello",
            paragraphs = new[]
            {
                new { text = "Executive Catering CT brings culinary excellence to every event. Whether you\u2019re planning an intimate gathering or a grand celebration, our team crafts menus tailored to your vision \u2014 using fresh, locally sourced ingredients whenever possible." },
                new { text = "With years of experience serving Connecticut, we understand that every event tells a story. From the first bite to the last, our goal is to make your occasion unforgettable." },
                new { text = "We believe great food brings people together. That\u2019s why we start every conversation with \u201cyes\u201d and work from there to build a custom experience you and your guests will love." }
            },
            sidebarHeading = "Get In Touch"
        });

        // Parallax Break 1
        await ctx.UpsertContentAsync(portfolioId, "parallax-break", "parallax-1", new
        {
            heading = "Eat Together",
            subtext = "Food is the ingredient that binds us together",
            backgroundImage = "assets/img/parallax-1.jpg"
        });

        // Parallax Break 2
        await ctx.UpsertContentAsync(portfolioId, "parallax-break", "parallax-2", new
        {
            heading = "Our Space",
            subtext = "Where preparation meets presentation",
            backgroundImage = "assets/img/parallax-2.jpg"
        });

        // Services Section
        await ctx.UpsertContentAsync(portfolioId, "services", "default", new
        {
            heading = "What We Do",
            subtitle = "Crafted with care, served with pride",
            description = "From hors d\u2019oeuvres to plated dinners, buffets to food stations \u2014 we customize every menu to match your event\u2019s style and budget.",
            galleryImages = new[]
            {
                new { src = "assets/img/gallery-plated.jpg", alt = "Beautifully plated dinner" },
                new { src = "assets/img/gallery-buffet.jpg", alt = "Gourmet buffet spread" },
                new { src = "assets/img/gallery-cocktail.jpg", alt = "Cocktail hour setup" }
            },
            stats = new[]
            {
                new { count = "500", suffix = "+", title = "Events Catered", description = "From intimate dinners to large-scale corporate functions, we\u2019ve done it all." },
                new { count = "15", suffix = " yrs", title = "Years of Experience", description = "Over a decade of serving Connecticut with consistency and passion." },
                new { count = "50", suffix = "+", title = "Menu Options", description = "Custom menus for every palate, dietary need, and occasion." }
            }
        });

        // Capabilities Section
        await ctx.UpsertContentAsync(portfolioId, "capabilities", "default", new
        {
            heading = "What We Bring",
            subtitle = "Everything you need, nothing you don\u2019t",
            cards = new[]
            {
                new { icon = "\u2733", title = "Full-Service Catering", description = "From kitchen to table, we handle every detail so you can enjoy the moment." },
                new { icon = "\u2668", title = "Bar & Beverage", description = "Signature cocktails, wine pairings, and full bar service with licensed bartenders." },
                new { icon = "\u270E", title = "Event Planning", description = "Coordination with your venue, florist, and entertainment for a seamless event." }
            },
            rotatingPhrases = new[]
            {
                new { text = "Weddings & Receptions" },
                new { text = "Corporate Luncheons" },
                new { text = "Holiday Parties" },
                new { text = "Private Dinners" },
                new { text = "Graduation Celebrations" },
                new { text = "Fundraisers & Galas" }
            }
        });

        // Footer
        await ctx.UpsertContentAsync(portfolioId, "footer", "default", new
        {
            ctaHeading = "Let\u2019s Create Together",
            ctaSubtext = "Tell us about your event and we\u2019ll start with yes",
            ctaButtonText = "Get A Quote",
            ctaButtonLink = "inquiry/",
            copyrightTemplate = "\u00a9 {year} Executive Catering CT \u00b7 Wallingford, Connecticut",
            builtByText = "Built by Fernando Vargas",
            builtByUrl = "https://fernando-vargas.com"
        });

        // Inquiry Landing Page
        await ctx.UpsertContentAsync(portfolioId, "inquiry-landing", "default", new
        {
            pageTitle = "Request a Quote - Executive Catering CT",
            pageDescription = "Tell us about your event. Executive Catering CT provides full-service catering for corporate and social events across Connecticut.",
            heading = "Let\u2019s Plan Your Event",
            subtitle = "Tell us what kind of event you\u2019re planning and we\u2019ll take it from there.",
            cards = new[]
            {
                new
                {
                    title = "Corporate Inquiry",
                    description = "Company events, conferences, board meetings, holiday parties, team lunches, and fundraisers.",
                    ctaText = "Start Corporate Inquiry \u2192",
                    href = "../inquiry.html",
                    iconId = "briefcase"
                },
                new
                {
                    title = "Social Inquiry",
                    description = "Weddings, birthdays, graduations, anniversaries, baby showers, and private celebrations.",
                    ctaText = "Start Social Inquiry \u2192",
                    href = "../social-inquiry.html",
                    iconId = "heart"
                }
            },
            helpText = "Not sure which to choose? No worries \u2014 call us at (203) 555-1234 and we\u2019ll help."
        });

        // Corporate Inquiry Form
        await ctx.UpsertContentAsync(portfolioId, "corporate-inquiry", "default", new
        {
            pageTitle = "Corporate Inquiry - Executive Catering CT",
            pageDescription = "Tell us about your event. Executive Catering CT provides full-service catering for corporate events across Connecticut.",
            welcomeHeading = "Let\u2019s Plan! Corporate Events are our specialty.",
            welcomeSubtext = "Tell us a bit more:",
            startButtonText = "Start",
            steps = new[]
            {
                new { id = "firstName", question = "Your first name?", description = "", fieldType = "text", placeholder = "Type your answer here...", required = true, choices = Array.Empty<object>() },
                new { id = "lastName", question = "Hi {firstName}! What\u2019s your last name?", description = "", fieldType = "text", placeholder = "Type your answer here...", required = true, choices = Array.Empty<object>() },
                new { id = "email", question = "Thanks {firstName} {lastName}! What\u2019s your email?", description = "", fieldType = "email", placeholder = "name@example.com", required = true, choices = Array.Empty<object>() },
                new { id = "phone", question = "And a good phone number for us to give you a call?", description = "", fieldType = "tel", placeholder = "(203) 555-1234", required = true, choices = Array.Empty<object>() },
                new { id = "company", question = "{firstName}, for what company are you inquiring?", description = "", fieldType = "text", placeholder = "Type your answer here...", required = false, choices = Array.Empty<object>() },
                new { id = "nonprofit", question = "Are you a non-profit organization?", description = "", fieldType = "yesno", placeholder = "", required = true, choices = new object[] { new { value = "Yes", label = "Yes" }, new { value = "No", label = "No" } } },
                new { id = "eventDate", question = "What is the event date?", description = "If unsure, give us your best guess!", fieldType = "date", placeholder = "", required = true, choices = Array.Empty<object>() },
                new { id = "hasVenue", question = "Do you have a venue?", description = "", fieldType = "yesno", placeholder = "", required = true, choices = new object[] { new { value = "Yes", label = "Yes" }, new { value = "No", label = "No" } } },
                new { id = "venueName", question = "Awesome \u2014 what is the name of your venue?", description = "", fieldType = "text", placeholder = "Type your answer here...", required = true, choices = Array.Empty<object>() },
                new { id = "budgetNoVenue", question = "No worries! What about your estimated budget?", description = "If you\u2019re not sure, we are here to help you figure it out.", fieldType = "text", placeholder = "Type your answer here...", required = true, choices = Array.Empty<object>() },
                new { id = "budgetWithVenue", question = "What about your estimated budget?", description = "If you\u2019re not sure, no worries! We are here to help you figure it out.", fieldType = "text", placeholder = "Type your answer here...", required = true, choices = Array.Empty<object>() }
            },
            guestCountChoices = new[]
            {
                new { value = "50 and under", label = "50 and under" },
                new { value = "50-100", label = "50-100" },
                new { value = "100-200", label = "100-200" },
                new { value = "200+", label = "200+" }
            },
            thankYouHeading = "Thanks {firstName}!",
            thankYouMessage = "One of our team members will be in touch with you soon.",
            thankYouUrgent = "Have an urgent need? Call us at (203) 555-1234",
            backToHomeText = "Back to Home",
            apiEndpoint = "/api/inquiries"
        });

        // Social Inquiry Form
        await ctx.UpsertContentAsync(portfolioId, "social-inquiry", "default", new
        {
            pageTitle = "Social Inquiry - Executive Catering CT",
            pageDescription = "Planning a wedding, birthday, or celebration? Tell us about your event. Executive Catering CT provides full-service catering across Connecticut.",
            welcomeHeading = "Let\u2019s Celebrate! Tell us about your special day.",
            welcomeSubtext = "Weddings, birthdays, graduations \u2014 we\u2019ll make it unforgettable.",
            startButtonText = "Start",
            eventTypeChoices = new[]
            {
                new { value = "Wedding", label = "Wedding / Reception" },
                new { value = "Birthday", label = "Birthday Party" },
                new { value = "Graduation", label = "Graduation" },
                new { value = "Anniversary", label = "Anniversary" },
                new { value = "Baby Shower", label = "Baby / Bridal Shower" },
                new { value = "Other", label = "Other Celebration" }
            },
            guestCountChoices = new[]
            {
                new { value = "Under 25", label = "Under 25" },
                new { value = "25-50", label = "25 \u2013 50" },
                new { value = "50-100", label = "50 \u2013 100" },
                new { value = "100-200", label = "100 \u2013 200" },
                new { value = "200+", label = "200+" }
            },
            steps = new[]
            {
                new { id = "firstName", question = "Your first name?", description = "", fieldType = "text", placeholder = "Type your answer here...", required = true },
                new { id = "lastName", question = "Hi {firstName}! What\u2019s your last name?", description = "", fieldType = "text", placeholder = "Type your answer here...", required = true },
                new { id = "email", question = "Thanks {firstName}! What\u2019s your email?", description = "", fieldType = "email", placeholder = "name@example.com", required = true },
                new { id = "phone", question = "And a good phone number to reach you?", description = "", fieldType = "tel", placeholder = "(203) 555-1234", required = true },
                new { id = "eventType", question = "{firstName}, what type of event are you celebrating?", description = "", fieldType = "choice", placeholder = "", required = true },
                new { id = "eventDate", question = "When is the big day?", description = "If you haven\u2019t settled on a date yet, your best guess works!", fieldType = "date", placeholder = "", required = true },
                new { id = "guestCount", question = "How many guests are you expecting?", description = "", fieldType = "choice", placeholder = "", required = true },
                new { id = "hasVenue", question = "Do you already have a venue picked out?", description = "", fieldType = "yesno", placeholder = "", required = true },
                new { id = "venueName", question = "Love it \u2014 where will the celebration be?", description = "", fieldType = "text", placeholder = "Venue name or address...", required = true },
                new { id = "budgetNoVenue", question = "No problem! What\u2019s your estimated catering budget?", description = "Don\u2019t worry if you\u2019re unsure \u2014 we can help you figure it out.", fieldType = "text", placeholder = "e.g. $2,000 or 'not sure yet'", required = true },
                new { id = "budgetWithVenue", question = "What\u2019s your estimated catering budget?", description = "A rough range is perfectly fine \u2014 we\u2019ll work with you.", fieldType = "text", placeholder = "e.g. $3,000 or 'flexible'", required = true },
                new { id = "specialRequests", question = "Last one! Anything else you\u2019d like us to know?", description = "Dietary needs, themes, must-have dishes, your dream vision \u2014 we love details!", fieldType = "textarea", placeholder = "Tell us your vision...", required = false }
            },
            thankYouHeading = "Thanks {firstName}!",
            thankYouMessage = "We\u2019re excited to help you celebrate. One of our team members will be in touch shortly.",
            thankYouUrgent = "Need to talk sooner? Call us at (203) 555-1234",
            backToHomeText = "Back to Home",
            apiEndpoint = "/api/inquiries"
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.ExecutiveCateringPortfolioId;

        // Delete content first
        await ctx.DeleteContentAsync(portfolioId, "social-inquiry", "default");
        await ctx.DeleteContentAsync(portfolioId, "corporate-inquiry", "default");
        await ctx.DeleteContentAsync(portfolioId, "inquiry-landing", "default");
        await ctx.DeleteContentAsync(portfolioId, "footer", "default");
        await ctx.DeleteContentAsync(portfolioId, "capabilities", "default");
        await ctx.DeleteContentAsync(portfolioId, "services", "default");
        await ctx.DeleteContentAsync(portfolioId, "parallax-break", "parallax-2");
        await ctx.DeleteContentAsync(portfolioId, "parallax-break", "parallax-1");
        await ctx.DeleteContentAsync(portfolioId, "about", "default");
        await ctx.DeleteContentAsync(portfolioId, "hero", "default");
        await ctx.DeleteContentAsync(portfolioId, "navigation", "default");
        await ctx.DeleteContentAsync(portfolioId, "site-config", "default");

        // Then delete definitions
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "social-inquiry");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "corporate-inquiry");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "inquiry-landing");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "footer");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "capabilities");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "services");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "parallax-break");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "about");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "hero");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "navigation");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "site-config");

        await ctx.SaveChangesAsync();
    }
}
