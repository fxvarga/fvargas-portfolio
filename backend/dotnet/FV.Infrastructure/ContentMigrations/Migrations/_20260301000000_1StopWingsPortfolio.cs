namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions and content for the 1 Stop Wings portfolio.
/// Includes site config, hero, ordering platforms, menu categories, menu items,
/// flavors, navigation, and footer. Designed with future online ordering in mind.
/// </summary>
public class _20260301000000_1StopWingsPortfolio : ContentMigration
{
    public override string Description => "Create entity definitions and content for 1 Stop Wings portfolio";

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.OneStopWingsPortfolioId;

        // ================================================================
        // ENTITY DEFINITIONS
        // ================================================================

        // Site Configuration
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "site-config", def => def
            .DisplayName("Site Configuration").Description("Store information and global settings").Icon("settings").Category("Settings").IsSingleton(true)
            .AddAttribute(a => a.Name("storeName").Type("string").Required().Label("Store Name"))
            .AddAttribute(a => a.Name("address").Type("string").Label("Street Address"))
            .AddAttribute(a => a.Name("city").Type("string").Label("City"))
            .AddAttribute(a => a.Name("state").Type("string").Label("State"))
            .AddAttribute(a => a.Name("zip").Type("string").Label("ZIP Code"))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Phone Number"))
            .AddAttribute(a => a.Name("hours").Type("array").Label("Business Hours")
                .Children(cb => cb
                    .Add(c => c.Name("days").Type("string").Label("Days"))
                    .Add(c => c.Name("open").Type("string").Label("Open"))
                    .Add(c => c.Name("close").Type("string").Label("Close"))))
            .AddAttribute(a => a.Name("analyticsDomain").Type("string").Label("Analytics Domain")));

        // Hero Section
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "hero", def => def
            .DisplayName("Hero Section").Description("Landing page hero image and tagline").Icon("star").Category("Sections").IsSingleton(true)
            .AddAttribute(a => a.Name("image").Type("image").Label("Hero Image"))
            .AddAttribute(a => a.Name("imageAlt").Type("string").Label("Image Alt Text"))
            .AddAttribute(a => a.Name("tagline").Type("string").Label("Tagline")));

        // Ordering Platforms (collection)
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "ordering-platform", def => def
            .DisplayName("Ordering Platform").Description("Third-party ordering links and in-store menu").Icon("shopping_cart").Category("Content")
            .AddAttribute(a => a.Name("name").Type("string").Required().Label("Platform Name"))
            .AddAttribute(a => a.Name("url").Type("string").Required().Label("URL"))
            .AddAttribute(a => a.Name("colorHex").Type("string").Label("Button Color (hex)"))
            .AddAttribute(a => a.Name("cssClass").Type("string").Label("CSS Class"))
            .AddAttribute(a => a.Name("displayOrder").Type("number").Required().Label("Display Order"))
            .AddAttribute(a => a.Name("isActive").Type("boolean").Label("Active"))
            .AddAttribute(a => a.Name("opensNewTab").Type("boolean").Label("Opens New Tab")));

        // Menu Categories (collection)
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "menu-category", def => def
            .DisplayName("Menu Category").Description("Menu section groupings").Icon("restaurant_menu").Category("Menu")
            .AddAttribute(a => a.Name("name").Type("string").Required().Label("Category Name"))
            .AddAttribute(a => a.Name("slug").Type("string").Required().Label("Slug"))
            .AddAttribute(a => a.Name("colorTheme").Type("select").Label("Color Theme")
                .Options(("blue", "Blue"), ("red", "Red")))
            .AddAttribute(a => a.Name("displayOrder").Type("number").Required().Label("Display Order"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description")));

        // Menu Items (collection) — designed for future online ordering
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "menu-item", def => def
            .DisplayName("Menu Item").Description("Individual food/drink items").Icon("lunch_dining").Category("Menu")
            .AddAttribute(a => a.Name("name").Type("string").Required().Label("Item Name"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("categorySlug").Type("string").Required().Label("Category Slug"))
            .AddAttribute(a => a.Name("price").Type("number").Label("Base Price"))
            .AddAttribute(a => a.Name("sizes").Type("array").Label("Size Variants")
                .Children(cb => cb
                    .Add(c => c.Name("label").Type("string").Label("Size Label"))
                    .Add(c => c.Name("price").Type("number").Label("Size Price"))))
            .AddAttribute(a => a.Name("isAvailable").Type("boolean").Label("Currently Available"))
            .AddAttribute(a => a.Name("displayOrder").Type("number").Required().Label("Display Order"))
            .AddAttribute(a => a.Name("note").Type("string").Label("Special Note"))
            .AddAttribute(a => a.Name("image").Type("image").Label("Item Image")));

        // Flavors (collection)
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "flavor", def => def
            .DisplayName("Flavor").Description("Wing/tender flavor options").Icon("local_fire_department").Category("Menu")
            .AddAttribute(a => a.Name("name").Type("string").Required().Label("Flavor Name"))
            .AddAttribute(a => a.Name("isWarning").Type("boolean").Label("Warning Label (spicy)"))
            .AddAttribute(a => a.Name("displayOrder").Type("number").Required().Label("Display Order"))
            .AddAttribute(a => a.Name("appliesToCategories").Type("array").Label("Applies to Categories")
                .Children(cb => cb
                    .Add(c => c.Name("categorySlug").Type("string").Label("Category Slug")))));

        // Navigation
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "navigation", def => def
            .DisplayName("Navigation").Description("Site header and navigation settings").Icon("menu").Category("Layout").IsSingleton(true)
            .AddAttribute(a => a.Name("logo").Type("image").Label("Logo Image"))
            .AddAttribute(a => a.Name("logoAlt").Type("string").Label("Logo Alt Text"))
            .AddAttribute(a => a.Name("backLinkText").Type("string").Label("Back Link Text"))
            .AddAttribute(a => a.Name("backLinkUrl").Type("string").Label("Back Link URL")));

        // Footer
        await ctx.UpsertEntityDefinitionAsync(portfolioId, "footer", def => def
            .DisplayName("Footer").Description("Site footer branding").Icon("bottom_navigation").Category("Layout").IsSingleton(true)
            .AddAttribute(a => a.Name("text").Type("text").Label("Footer Text"))
            .AddAttribute(a => a.Name("parentBrandName").Type("string").Label("Parent Brand Name"))
            .AddAttribute(a => a.Name("parentBrandUrl").Type("string").Label("Parent Brand URL"))
            .AddAttribute(a => a.Name("parentBrandLogo").Type("image").Label("Parent Brand Logo")));

        await ctx.SaveChangesAsync();

        // ================================================================
        // SEED CONTENT
        // ================================================================

        // --- Site Config ---
        await ctx.UpsertContentAsync(portfolioId, "site-config", "default", new
        {
            storeName = "1 Stop Wings",
            address = "68 North Turnpike Rd",
            city = "Wallingford",
            state = "CT",
            zip = "06492",
            phone = "203.303.1915",
            hours = new[]
            {
                new { days = "Mon - Fri", open = "7:30am", close = "8:00pm" },
                new { days = "Sat - Sun", open = "8:00am", close = "7:30pm" }
            },
            analyticsDomain = "1stopwings.executivecateringct.com"
        });

        // --- Hero ---
        await ctx.UpsertContentAsync(portfolioId, "hero", "default", new
        {
            image = "assets/img/hero-wings.png",
            imageAlt = "Delicious 1 Stop Wings",
            tagline = ""
        });

        // --- Ordering Platforms ---
        await ctx.UpsertContentAsync(portfolioId, "ordering-platform", "doordash", new
        {
            name = "Order on DoorDash",
            url = "https://www.doordash.com/store/1-stop-wings-wallingford-863625/1770854/",
            colorHex = "#ff3008",
            cssClass = "doordash",
            displayOrder = 1,
            isActive = true,
            opensNewTab = true
        });

        await ctx.UpsertContentAsync(portfolioId, "ordering-platform", "ubereats", new
        {
            name = "Order on Uber Eats",
            url = "https://www.ubereats.com/store/one-stop-wings/_nKNOFUzRIa1IBbio3Dzow?diningMode=DELIVERY&pl=JTdCJTIyYWRkcmVzcyUyMiUzQSUyMjIzMCUyME1haW4lMjBTdCUyMiUyQyUyMnJlZmVyZW5jZSUyMiUzQSUyMjRiYmNhMWE2LWNjM2ItNTVlYS0yODEzLWY3YjA5MTViN2FhNSUyMiUyQyUyMnJlZmVyZW5jZVR5cGUlMjIlM0ElMjJ1YmVyX3BsYWNlcyUyMiUyQyUyMmxhdGl0dWRlJTIyJTNBNDEuNDgwOTQlMkMlMjJsb25naXR1ZGUlMjIlM0EtNzIuODI1ODclN0Q%3D&surfaceName=",
            colorHex = "#06c167",
            cssClass = "ubereats",
            displayOrder = 2,
            isActive = true,
            opensNewTab = true
        });

        await ctx.UpsertContentAsync(portfolioId, "ordering-platform", "grubhub", new
        {
            name = "Order on GrubHub",
            url = "https://www.grubhub.com/restaurant/1-stop-wings-68-n-turnpike-rd-wallingford/2082283?proof=true",
            colorHex = "#f85a00",
            cssClass = "grubhub",
            displayOrder = 3,
            isActive = true,
            opensNewTab = true
        });

        await ctx.UpsertContentAsync(portfolioId, "ordering-platform", "in-store-menu", new
        {
            name = "VIEW IN-STORE MENU",
            url = "menu.html",
            colorHex = "",
            cssClass = "store-menu",
            displayOrder = 4,
            isActive = true,
            opensNewTab = false
        });

        await ctx.UpsertContentAsync(portfolioId, "ordering-platform", "executive-catering", new
        {
            name = "Executive Catering CT",
            url = "https://executivecateringct.com",
            colorHex = "",
            cssClass = "catering-link",
            displayOrder = 5,
            isActive = true,
            opensNewTab = true
        });

        // --- Menu Categories ---
        await ctx.UpsertContentAsync(portfolioId, "menu-category", "wings-and-tenders", new
        {
            name = "WINGS & TENDERS",
            slug = "wings-and-tenders",
            colorTheme = "blue",
            displayOrder = 1,
            description = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-category", "sandwiches", new
        {
            name = "SANDWICHES",
            slug = "sandwiches",
            colorTheme = "red",
            displayOrder = 2,
            description = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-category", "soup-and-specials", new
        {
            name = "SOUP & SPECIALS",
            slug = "soup-and-specials",
            colorTheme = "blue",
            displayOrder = 3,
            description = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-category", "ribs-and-boxes", new
        {
            name = "RIBS & BOXES",
            slug = "ribs-and-boxes",
            colorTheme = "blue",
            displayOrder = 4,
            description = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-category", "drinks", new
        {
            name = "DRINKS",
            slug = "drinks",
            colorTheme = "red",
            displayOrder = 5,
            description = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-category", "salads", new
        {
            name = "SALADS",
            slug = "salads",
            colorTheme = "blue",
            displayOrder = 6,
            description = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-category", "sides-and-extras", new
        {
            name = "SIDES & EXTRAS",
            slug = "sides-and-extras",
            colorTheme = "red",
            displayOrder = 7,
            description = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-category", "dips", new
        {
            name = "DIPS",
            slug = "dips",
            colorTheme = "blue",
            displayOrder = 8,
            description = "Blue Cheese or Ranch. Extra 2oz cups available."
        });

        // --- Menu Items ---

        // Wings & Tenders
        await ctx.UpsertContentAsync(portfolioId, "menu-item", "classic-or-boneless-wings", new
        {
            name = "Classic or Boneless Wings",
            description = "Crispy outside, tender inside.",
            categorySlug = "wings-and-tenders",
            price = (decimal?)null,
            sizes = new[]
            {
                new { label = "x6", price = (decimal?)null },
                new { label = "x12", price = (decimal?)null },
                new { label = "x24", price = (decimal?)null },
                new { label = "x50", price = (decimal?)null }
            },
            isAvailable = true,
            displayOrder = 1,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "hand-battered-tenders", new
        {
            name = "Hand-Battered Tenders",
            description = "Golden strips served with sauce.",
            categorySlug = "wings-and-tenders",
            price = (decimal?)null,
            sizes = new[]
            {
                new { label = "x3", price = (decimal?)null },
                new { label = "x5", price = (decimal?)null },
                new { label = "x10", price = (decimal?)null }
            },
            isAvailable = true,
            displayOrder = 2,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "nuggets", new
        {
            name = "Nuggets",
            description = "Golden-fried and delicious.",
            categorySlug = "wings-and-tenders",
            price = (decimal?)null,
            sizes = new[]
            {
                new { label = "x6", price = (decimal?)null },
                new { label = "x12", price = (decimal?)null },
                new { label = "x24", price = (decimal?)null }
            },
            isAvailable = true,
            displayOrder = 3,
            note = "",
            image = ""
        });

        // Sandwiches
        await ctx.UpsertContentAsync(portfolioId, "menu-item", "breakfast-egg-sandwich", new
        {
            name = "Breakfast Egg Sandwich",
            description = "Two eggs, Lettuce & Mayo. Add Cheese or Bacon at no cost.",
            categorySlug = "sandwiches",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 1,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "the-classic-burger", new
        {
            name = "The Classic Burger",
            description = "Premium grilled beef. Includes Pickles, Tomato, Lettuce, Ketchup, Mustard, Mayo.",
            categorySlug = "sandwiches",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 2,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "chicken-sandwich", new
        {
            name = "Chicken Sandwich",
            description = "Grilled or Crispy. Includes Lettuce, Tomato, Onion, Pickles. Tossed in any sauce.",
            categorySlug = "sandwiches",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 3,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "fish-sandwich", new
        {
            name = "Fish Sandwich",
            description = "Hand-cut grilled fillet. Includes Lettuce, Tomato, Onion, Tartar Sauce.",
            categorySlug = "sandwiches",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 4,
            note = "",
            image = ""
        });

        // Soup & Specials
        await ctx.UpsertContentAsync(portfolioId, "menu-item", "chicken-soup", new
        {
            name = "Chicken Soup",
            description = "Hearty chicken and vegetables. Choose Classic or Creamy.",
            categorySlug = "soup-and-specials",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 1,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "lunch-special", new
        {
            name = "Lunch Special",
            description = "Ask about today's special lunch box.",
            categorySlug = "soup-and-specials",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 2,
            note = "",
            image = ""
        });

        // Ribs & Boxes
        await ctx.UpsertContentAsync(portfolioId, "menu-item", "slow-roasted-ribs", new
        {
            name = "Slow-Roasted Ribs",
            description = "BBQ or House Dry Rub. Includes Home Fries + one 8oz side.",
            categorySlug = "ribs-and-boxes",
            price = (decimal?)null,
            sizes = new[]
            {
                new { label = "Full Rack", price = (decimal?)null },
                new { label = "Half Rack", price = (decimal?)null }
            },
            isAvailable = true,
            displayOrder = 1,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "breakfast-box", new
        {
            name = "Breakfast Box",
            description = "2 Eggs, Bacon or Sausage, and Hashbrowns or Home Fries.",
            categorySlug = "ribs-and-boxes",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 2,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "ribs-box", new
        {
            name = "Ribs Box",
            description = "3-Rib Box served with Home Fries, 8oz side, and a Soda.",
            categorySlug = "ribs-and-boxes",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 3,
            note = "",
            image = ""
        });

        // Drinks
        await ctx.UpsertContentAsync(portfolioId, "menu-item", "chilled-soda", new
        {
            name = "Chilled Soda (12oz Cans)",
            description = "Classic Coke, Diet Coke, or Sprite.",
            categorySlug = "drinks",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 1,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "bottled-water", new
        {
            name = "Bottled Water",
            description = "Pure, refreshing spring water.",
            categorySlug = "drinks",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 2,
            note = "",
            image = ""
        });

        // Salads
        await ctx.UpsertContentAsync(portfolioId, "menu-item", "caesar-salad", new
        {
            name = "Caesar Salad",
            description = "Crisp romaine, crunchy croutons, and creamy Caesar dressing.",
            categorySlug = "salads",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 1,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "italian-salad", new
        {
            name = "Italian Salad",
            description = "Iceberg, olives, onions, tomatoes, and carrots with Italian dressing.",
            categorySlug = "salads",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 2,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "spring-salad", new
        {
            name = "Spring Salad",
            description = "Fresh green mix, onions, carrots, tomatoes, and cucumber.",
            categorySlug = "salads",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 3,
            note = "",
            image = ""
        });

        // Sides & Extras
        await ctx.UpsertContentAsync(portfolioId, "menu-item", "chips-and-dip", new
        {
            name = "Chips & Dip",
            description = "Corn chips with Salsa (Classic/Hot) or Creamy Queso.",
            categorySlug = "sides-and-extras",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 1,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "signature-fries", new
        {
            name = "Signature Fries",
            description = "Classic salt-dusted or Seasoned Curly Fries.",
            categorySlug = "sides-and-extras",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 2,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "mac-and-cheese-baked-beans", new
        {
            name = "Mac & Cheese / Baked Beans",
            description = "Creamy macaroni or traditional tangy slow-cooked beans.",
            categorySlug = "sides-and-extras",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 3,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "coleslaw-celery-carrots", new
        {
            name = "Coleslaw / Celery & Carrots",
            description = "Creamy dressing crunch or fresh sticks with Dip.",
            categorySlug = "sides-and-extras",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 4,
            note = "",
            image = ""
        });

        await ctx.UpsertContentAsync(portfolioId, "menu-item", "the-combo", new
        {
            name = "The Combo",
            description = "Add Fries and a refreshing Soda to any meal.",
            categorySlug = "sides-and-extras",
            price = (decimal?)null,
            sizes = Array.Empty<object>(),
            isAvailable = true,
            displayOrder = 5,
            note = "",
            image = ""
        });

        // --- Flavors ---
        await ctx.UpsertContentAsync(portfolioId, "flavor", "naked", new
        {
            name = "Naked",
            isWarning = false,
            displayOrder = 1,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "bbq", new
        {
            name = "BBQ",
            isWarning = false,
            displayOrder = 2,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "buffalo", new
        {
            name = "Buffalo",
            isWarning = false,
            displayOrder = 3,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "honey-heat", new
        {
            name = "Honey Heat",
            isWarning = false,
            displayOrder = 4,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "honey-mustard", new
        {
            name = "Honey Mustard",
            isWarning = false,
            displayOrder = 5,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "teriyaki", new
        {
            name = "Teriyaki",
            isWarning = false,
            displayOrder = 6,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "warning-sauce", new
        {
            name = "WARNING SAUCE!",
            isWarning = true,
            displayOrder = 7,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "dirty-rub", new
        {
            name = "Dirty Rub",
            isWarning = false,
            displayOrder = 8,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "garlic-parm", new
        {
            name = "Garlic Parm",
            isWarning = false,
            displayOrder = 9,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "house-rub", new
        {
            name = "House Rub",
            isWarning = false,
            displayOrder = 10,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        await ctx.UpsertContentAsync(portfolioId, "flavor", "sweet-and-smokey", new
        {
            name = "Sweet & Smokey",
            isWarning = false,
            displayOrder = 11,
            appliesToCategories = new[] { new { categorySlug = "wings-and-tenders" } }
        });

        // --- Navigation ---
        await ctx.UpsertContentAsync(portfolioId, "navigation", "default", new
        {
            logo = "../_shared/img/1stop-logo-header.png",
            logoAlt = "1 Stop Wings Logo",
            backLinkText = "\u2190 Back to Ordering",
            backLinkUrl = "index.html"
        });

        // --- Footer ---
        await ctx.UpsertContentAsync(portfolioId, "footer", "default", new
        {
            text = "1 Stop Wings is powered by the culinary team at",
            parentBrandName = "Executive Catering CT",
            parentBrandUrl = "https://executivecateringct.com",
            parentBrandLogo = "../_shared/img/ecct-logo-final.png"
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        var portfolioId = ContentMigrationContext.OneStopWingsPortfolioId;

        // Delete content first (reverse order)
        await ctx.DeleteContentAsync(portfolioId, "footer", "default");
        await ctx.DeleteContentAsync(portfolioId, "navigation", "default");

        // Flavors
        foreach (var slug in new[] { "naked", "bbq", "buffalo", "honey-heat", "honey-mustard",
            "teriyaki", "warning-sauce", "dirty-rub", "garlic-parm", "house-rub", "sweet-and-smokey" })
        {
            await ctx.DeleteContentAsync(portfolioId, "flavor", slug);
        }

        // Menu items
        foreach (var slug in new[] { "classic-or-boneless-wings", "hand-battered-tenders", "nuggets",
            "breakfast-egg-sandwich", "the-classic-burger", "chicken-sandwich", "fish-sandwich",
            "chicken-soup", "lunch-special", "slow-roasted-ribs", "breakfast-box", "ribs-box",
            "chilled-soda", "bottled-water", "caesar-salad", "italian-salad", "spring-salad",
            "chips-and-dip", "signature-fries", "mac-and-cheese-baked-beans",
            "coleslaw-celery-carrots", "the-combo" })
        {
            await ctx.DeleteContentAsync(portfolioId, "menu-item", slug);
        }

        // Menu categories
        foreach (var slug in new[] { "wings-and-tenders", "sandwiches", "soup-and-specials",
            "ribs-and-boxes", "drinks", "salads", "sides-and-extras", "dips" })
        {
            await ctx.DeleteContentAsync(portfolioId, "menu-category", slug);
        }

        // Ordering platforms
        foreach (var slug in new[] { "doordash", "ubereats", "grubhub", "in-store-menu", "executive-catering" })
        {
            await ctx.DeleteContentAsync(portfolioId, "ordering-platform", slug);
        }

        await ctx.DeleteContentAsync(portfolioId, "hero", "default");
        await ctx.DeleteContentAsync(portfolioId, "site-config", "default");

        // Then delete definitions
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "footer");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "navigation");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "flavor");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "menu-item");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "menu-category");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "ordering-platform");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "hero");
        await ctx.DeleteEntityDefinitionAsync(portfolioId, "site-config");

        await ctx.SaveChangesAsync();
    }
}
