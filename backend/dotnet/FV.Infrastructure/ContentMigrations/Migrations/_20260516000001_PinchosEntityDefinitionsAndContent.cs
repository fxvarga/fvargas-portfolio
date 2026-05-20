namespace FV.Infrastructure.ContentMigrations.Migrations;

/// <summary>
/// Creates entity definitions and seeds content for the Pinchos Lounge portfolio.
/// Sections: site-config, navigation, hero, menu-category, menu-item, gallery,
///           events-page, find-us, more-page, footer
/// </summary>
public class _20260516000001_PinchosEntityDefinitionsAndContent : ContentMigration
{
    public override string Description => "Create Pinchos Lounge entity definitions and seed content";

    private static readonly Guid PortfolioId = ContentMigrationContext.PinchosPortfolioId;

    public override async Task UpAsync(ContentMigrationContext ctx)
    {
        // ──────────────────────────────────────────────────
        // ENTITY DEFINITIONS
        // ──────────────────────────────────────────────────

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "site-config", def => def
            .DisplayName("Site Configuration")
            .Description("Global settings for Pinchos Lounge")
            .Icon("settings")
            .Category("Settings")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("restaurantName").Type("string").Required().Label("Restaurant Name"))
            .AddAttribute(a => a.Name("tagline").Type("string").Label("Tagline"))
            .AddAttribute(a => a.Name("logoUrl").Type("string").Label("Logo URL"))
            .AddAttribute(a => a.Name("address").Type("string").Label("Address"))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Phone"))
            .AddAttribute(a => a.Name("email").Type("string").Label("Email"))
            .AddAttribute(a => a.Name("hours").Type("array").Label("Business Hours")
                .Children(c => c
                    .Add(ca => ca.Name("days").Type("string").Required().Label("Days"))
                    .Add(ca => ca.Name("time").Type("string").Required().Label("Time"))))
            .AddAttribute(a => a.Name("socialLinks").Type("array").Label("Social Links")
                .Children(c => c
                    .Add(ca => ca.Name("platform").Type("string").Required().Label("Platform"))
                    .Add(ca => ca.Name("url").Type("string").Required().Label("URL"))
                    .Add(ca => ca.Name("icon").Type("string").Label("Icon")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "navigation", def => def
            .DisplayName("Navigation")
            .Description("Bottom navigation bar items")
            .Icon("menu")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("items").Type("array").Label("Nav Items")
                .Children(c => c
                    .Add(ca => ca.Name("label").Type("string").Required().Label("Label"))
                    .Add(ca => ca.Name("href").Type("string").Required().Label("Link"))
                    .Add(ca => ca.Name("icon").Type("string").Label("Icon Name")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "hero", def => def
            .DisplayName("Hero Section")
            .Description("Homepage hero banner")
            .Icon("star")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("preTitle").Type("string").Label("Pre-Title"))
            .AddAttribute(a => a.Name("title").Type("string").Required().Label("Main Title"))
            .AddAttribute(a => a.Name("subTitle").Type("string").Label("Sub-Title"))
            .AddAttribute(a => a.Name("caption").Type("text").Label("Caption"))
            .AddAttribute(a => a.Name("ctaMenuLabel").Type("string").Label("Menu CTA Label"))
            .AddAttribute(a => a.Name("bgImageDesktop").Type("string").Label("Background Image (Desktop)"))
            .AddAttribute(a => a.Name("bgImageMobile").Type("string").Label("Background Image (Mobile)"))
            .AddAttribute(a => a.Name("addressLine").Type("string").Label("Address Line")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "menu-category", def => def
            .DisplayName("Menu Category")
            .Description("Menu category tabs")
            .Icon("folder")
            .Category("Menu")
            .IsSingleton(false)
            .AddAttribute(a => a.Name("name").Type("string").Required().Label("Category Name"))
            .AddAttribute(a => a.Name("slug").Type("string").Required().Label("Slug"))
            .AddAttribute(a => a.Name("sortOrder").Type("string").Label("Sort Order")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "menu-item", def => def
            .DisplayName("Menu Item")
            .Description("Individual menu item")
            .Icon("restaurant")
            .Category("Menu")
            .IsSingleton(false)
            .AddAttribute(a => a.Name("name").Type("string").Required().Label("Item Name"))
            .AddAttribute(a => a.Name("price").Type("string").Required().Label("Price"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("image").Type("string").Label("Image URL"))
            .AddAttribute(a => a.Name("tag").Type("string").Label("Tag (e.g. VEGETARIAN)"))
            .AddAttribute(a => a.Name("categorySlug").Type("string").Required().Label("Category Slug"))
            .AddAttribute(a => a.Name("sortOrder").Type("string").Label("Sort Order")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "gallery", def => def
            .DisplayName("Gallery")
            .Description("Photo gallery with category filtering")
            .Icon("image")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("categories").Type("array").Label("Filter Categories")
                .Children(c => c
                    .Add(ca => ca.Name("name").Type("string").Required().Label("Category Name"))))
            .AddAttribute(a => a.Name("images").Type("array").Label("Gallery Images")
                .Children(c => c
                    .Add(ca => ca.Name("src").Type("string").Required().Label("Image URL"))
                    .Add(ca => ca.Name("alt").Type("string").Label("Alt Text"))
                    .Add(ca => ca.Name("category").Type("string").Required().Label("Category")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "events-page", def => def
            .DisplayName("Events & Catering")
            .Description("Events and catering page content")
            .Icon("celebration")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("heading").Type("string").Required().Label("Heading"))
            .AddAttribute(a => a.Name("scriptLine").Type("string").Label("Script Line"))
            .AddAttribute(a => a.Name("description").Type("text").Label("Description"))
            .AddAttribute(a => a.Name("services").Type("array").Label("Services")
                .Children(c => c
                    .Add(ca => ca.Name("icon").Type("string").Label("Icon/Emoji"))
                    .Add(ca => ca.Name("label").Type("string").Required().Label("Label"))
                    .Add(ca => ca.Name("desc").Type("text").Label("Description"))))
            .AddAttribute(a => a.Name("collageImages").Type("array").Label("Collage Images")
                .Children(c => c
                    .Add(ca => ca.Name("src").Type("string").Required().Label("Image URL"))
                    .Add(ca => ca.Name("alt").Type("string").Label("Alt Text"))))
            .AddAttribute(a => a.Name("ctaLabel").Type("string").Label("CTA Button Label"))
            .AddAttribute(a => a.Name("ctaEmail").Type("string").Label("CTA Email")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "find-us", def => def
            .DisplayName("Find Us")
            .Description("Location, hours, and contact info")
            .Icon("location_on")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("locationImage").Type("string").Label("Location Image URL"))
            .AddAttribute(a => a.Name("restaurantName").Type("string").Label("Restaurant Name"))
            .AddAttribute(a => a.Name("addressLines").Type("text").Label("Address"))
            .AddAttribute(a => a.Name("hours").Type("array").Label("Hours")
                .Children(c => c
                    .Add(ca => ca.Name("days").Type("string").Required().Label("Days"))
                    .Add(ca => ca.Name("time").Type("string").Required().Label("Time"))))
            .AddAttribute(a => a.Name("phone").Type("string").Label("Phone Number"))
            .AddAttribute(a => a.Name("mapsUrl").Type("string").Label("Google Maps URL")));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "more-page", def => def
            .DisplayName("More Page")
            .Description("About section, links, and social media")
            .Icon("more_horiz")
            .Category("Sections")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("aboutImage").Type("string").Label("About Image URL"))
            .AddAttribute(a => a.Name("aboutText").Type("text").Label("About Text"))
            .AddAttribute(a => a.Name("links").Type("array").Label("Quick Links")
                .Children(c => c
                    .Add(ca => ca.Name("label").Type("string").Required().Label("Label"))
                    .Add(ca => ca.Name("icon").Type("string").Label("Icon/Emoji"))
                    .Add(ca => ca.Name("href").Type("string").Required().Label("Link URL"))))
            .AddAttribute(a => a.Name("socialLinks").Type("array").Label("Social Links")
                .Children(c => c
                    .Add(ca => ca.Name("platform").Type("string").Required().Label("Platform"))
                    .Add(ca => ca.Name("url").Type("string").Required().Label("URL")))));

        await ctx.UpsertEntityDefinitionAsync(PortfolioId, "footer", def => def
            .DisplayName("Footer")
            .Description("Site footer content")
            .Icon("dock")
            .Category("Layout")
            .IsSingleton(true)
            .AddAttribute(a => a.Name("copyright").Type("string").Label("Copyright Text"))
            .AddAttribute(a => a.Name("tagline").Type("string").Label("Tagline")));

        await ctx.SaveChangesAsync();

        // ──────────────────────────────────────────────────
        // CONTENT SEEDING
        // ──────────────────────────────────────────────────

        await ctx.UpsertContentAsync(PortfolioId, "site-config", "default", new
        {
            restaurantName = "Pinchos Lounge",
            tagline = "Late-Night Kabobs with Lounge Vibes",
            logoUrl = "/images/logo.png",
            address = "315 Peck St, New Haven, CT",
            phone = "+15551234567",
            email = "info@pinchoslounge.com",
            hours = new[]
            {
                new { days = "Mon – Thu", time = "5:00 PM – 12:00 AM" },
                new { days = "Fri – Sat", time = "5:00 PM – 2:00 AM" },
                new { days = "Sunday", time = "5:00 PM – 11:00 PM" }
            },
            socialLinks = new[]
            {
                new { platform = "Instagram", url = "https://instagram.com/pinchoslounge", icon = "instagram" },
                new { platform = "Facebook", url = "https://facebook.com/pinchoslounge", icon = "facebook" },
                new { platform = "TikTok", url = "https://tiktok.com/@pinchoslounge", icon = "tiktok" }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "navigation", "default", new
        {
            items = new[]
            {
                new { label = "HOME", href = "/", icon = "home" },
                new { label = "MENU", href = "/menu", icon = "menu" },
                new { label = "GALLERY", href = "/gallery", icon = "gallery" },
                new { label = "EVENTS", href = "/events", icon = "events" },
                new { label = "FIND US", href = "/find-us", icon = "findus" },
                new { label = "MORE", href = "/more", icon = "more" }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "hero", "default", new
        {
            preTitle = "Late-Night",
            title = "KABOBS",
            subTitle = "WITH LOUNGE VIBES",
            caption = "Savor bold flavors. Vibe late.\nLive it up. Only at Pinchos Lounge.",
            ctaMenuLabel = "VIEW MENU",
            bgImageDesktop = "/images/homepage-bg-desktop.png",
            bgImageMobile = "/images/homepage-bg-mobile.png",
            addressLine = "315 Peck St, New Haven, CT"
        });

        // ── Menu Categories ──
        var menuCategories = new[]
        {
            new { slug = "kabobs", name = "KABOBS", sortOrder = "1" },
            new { slug = "wraps", name = "WRAPS", sortOrder = "2" },
            new { slug = "fries", name = "FRIES", sortOrder = "3" },
            new { slug = "drinks", name = "DRINKS", sortOrder = "4" },
            new { slug = "specials", name = "SPECIALS", sortOrder = "5" }
        };

        foreach (var cat in menuCategories)
        {
            await ctx.UpsertContentAsync(PortfolioId, "menu-category", cat.slug, new
            {
                cat.name,
                cat.slug,
                cat.sortOrder
            });
        }

        // ── Menu Items ──
        var menuItems = new (string slug, string name, string price, string description, string image, string? tag, string categorySlug, string sortOrder)[]
        {
            ("chicken-kabob", "CHICKEN KABOB", "$15", "Marinated chicken, red onion, bell peppers, zucchini. Served with rice & garlic sauce.", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80", null, "kabobs", "1"),
            ("beef-kabob", "BEEF KABOB", "$16", "Tender grilled beef, peppers, onions, zucchini. Served with rice & yogurt sauce.", "https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=300&q=80", null, "kabobs", "2"),
            ("lamb-kabob", "LAMB KABOB", "$17", "Juicy lamb, charred veggies, zucchini, bell peppers. Served with warm pita & tzatziki.", "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&q=80", null, "kabobs", "3"),
            ("veggie-skewers", "VEGGIE SKEWERS", "$13", "Grilled mushrooms, zucchini, peppers, onion & cherry tomatoes. Served with rice & hummus.", "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80", "VEGETARIAN", "kabobs", "4"),
            ("loaded-fries-kabob", "LOADED FRIES", "$12", "Crispy fries, grilled chicken, garlic sauce, feta, pickled onions.", "https://images.unsplash.com/photo-1630384060421-cb20aebe213c?w=300&q=80", null, "kabobs", "5"),
            ("kabob-wrap", "KABOB WRAP", "$13", "Your choice of protein, pita, lettuce, tomato, pickled onions, garlic sauce.", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&q=80", null, "kabobs", "6"),
            ("signature-drinks", "SIGNATURE DRINKS", "$6+", "Lemonades, mocktails, cold teas & more.", "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80", null, "kabobs", "7"),
            ("chicken-wrap", "CHICKEN WRAP", "$13", "Grilled chicken, lettuce, tomato, pickled onion, garlic sauce in warm pita.", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300&q=80", null, "wraps", "1"),
            ("beef-wrap", "BEEF WRAP", "$14", "Seasoned beef, fresh veggies, tahini sauce wrapped in lavash.", "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&q=80", null, "wraps", "2"),
            ("falafel-wrap", "FALAFEL WRAP", "$12", "Crispy falafel, hummus, pickles, tomato, lettuce in pita.", "https://images.unsplash.com/photo-1593001874117-c99c800e3eb6?w=300&q=80", "VEGETARIAN", "wraps", "3"),
            ("loaded-fries", "LOADED FRIES", "$12", "Crispy fries, grilled chicken, garlic sauce, feta, pickled onions.", "https://images.unsplash.com/photo-1630384060421-cb20aebe213c?w=300&q=80", null, "fries", "1"),
            ("cheese-fries", "CHEESE FRIES", "$9", "Golden fries with melted cheese blend and jalapeños.", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80", null, "fries", "2"),
            ("plain-fries", "PLAIN FRIES", "$6", "Classic crispy golden fries with seasoning.", "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&q=80", null, "fries", "3"),
            ("pinchos-punch", "PINCHOS PUNCH", "$8", "Our signature tropical lemonade blend.", "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80", null, "drinks", "1"),
            ("hibiscus-lemonade", "HIBISCUS LEMONADE", "$7", "Fresh hibiscus, lemon, cane sugar over ice.", "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&q=80", null, "drinks", "2"),
            ("mango-iced-tea", "MANGO ICED TEA", "$6", "Cold brewed tea with mango and mint.", "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&q=80", null, "drinks", "3"),
            ("family-platter", "FAMILY PLATTER", "$45", "Mixed kabobs, rice, hummus, pita, salad. Feeds 3-4.", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80", null, "specials", "1"),
            ("date-night-combo", "DATE NIGHT COMBO", "$35", "2 kabob plates, 2 drinks, shared appetizer.", "https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=300&q=80", null, "specials", "2")
        };

        foreach (var item in menuItems)
        {
            await ctx.UpsertContentAsync(PortfolioId, "menu-item", item.slug, new
            {
                item.name,
                item.price,
                item.description,
                item.image,
                tag = item.tag ?? "",
                item.categorySlug,
                item.sortOrder
            });
        }

        await ctx.UpsertContentAsync(PortfolioId, "gallery", "default", new
        {
            categories = new[]
            {
                new { name = "ALL" },
                new { name = "FOOD" },
                new { name = "DRINKS" },
                new { name = "LOUNGE" },
                new { name = "EVENTS" }
            },
            images = new[]
            {
                new { src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80", category = "FOOD", alt = "Grilled kabobs" },
                new { src = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80", category = "DRINKS", alt = "Cocktail" },
                new { src = "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80", category = "LOUNGE", alt = "Lounge atmosphere" },
                new { src = "https://images.unsplash.com/photo-1532636875304-0c89119d9b4d?w=400&q=80", category = "FOOD", alt = "Chicken skewers" },
                new { src = "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&q=80", category = "DRINKS", alt = "Hibiscus mojito" },
                new { src = "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=400&q=80", category = "EVENTS", alt = "Party event" },
                new { src = "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400&q=80", category = "FOOD", alt = "Shrimp kabobs" },
                new { src = "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&q=80", category = "LOUNGE", alt = "Neon bar" },
                new { src = "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80", category = "FOOD", alt = "Lamb preparation" },
                new { src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80", category = "DRINKS", alt = "Turkish coffee" },
                new { src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80", category = "EVENTS", alt = "Celebration" },
                new { src = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80", category = "LOUNGE", alt = "Lounge seating" }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "events-page", "default", new
        {
            heading = "EVENTS & CATERING",
            scriptLine = "Let's Plan Something Unforgettable",
            description = "From private parties to corporate events, we bring the flavor, the vibe, and the unforgettable experience.",
            services = new[]
            {
                new { icon = "🎉", label = "Private Parties", desc = "Birthdays, anniversaries, celebrations — we handle it all." },
                new { icon = "🏢", label = "Corporate Events", desc = "Team events, product launches, networking nights." },
                new { icon = "🍽️", label = "Catering Services", desc = "Full-service catering for any occasion, any size." },
                new { icon = "📋", label = "Custom Menus", desc = "Tailored menus crafted for your event's needs." }
            },
            collageImages = new[]
            {
                new { src = "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=300&q=80", alt = "Event setup" },
                new { src = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80", alt = "Cocktails" },
                new { src = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=80", alt = "Catering food" },
                new { src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80", alt = "Party lights" }
            },
            ctaLabel = "GET IN TOUCH",
            ctaEmail = "events@pinchoslounge.com"
        });

        await ctx.UpsertContentAsync(PortfolioId, "find-us", "default", new
        {
            locationImage = "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80",
            restaurantName = "PINCHOS LOUNGE",
            addressLines = "315 Peck St\nNew Haven, CT 06513",
            hours = new[]
            {
                new { days = "Mon – Thu", time = "5:00 PM – 12:00 AM" },
                new { days = "Fri – Sat", time = "5:00 PM – 2:00 AM" },
                new { days = "Sunday", time = "5:00 PM – 11:00 PM" }
            },
            phone = "+15551234567",
            mapsUrl = "https://maps.google.com/?q=315+Peck+St+New+Haven+CT"
        });

        await ctx.UpsertContentAsync(PortfolioId, "more-page", "default", new
        {
            aboutImage = "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200&q=80",
            aboutText = "Pinchos Lounge is where bold flavors meet late-night vibes. We're more than kabobs – we're an experience.",
            links = new[]
            {
                new { label = "CONTACT US", icon = "✉️", href = "mailto:info@pinchoslounge.com" }
            },
            socialLinks = new[]
            {
                new { platform = "Instagram", url = "https://instagram.com/pinchoslounge" },
                new { platform = "Facebook", url = "https://facebook.com/pinchoslounge" },
                new { platform = "TikTok", url = "https://tiktok.com/@pinchoslounge" }
            }
        });

        await ctx.UpsertContentAsync(PortfolioId, "footer", "default", new
        {
            copyright = "© {year} Pinchos Lounge. All rights reserved.",
            tagline = "Late-Night Kabobs with Lounge Vibes"
        });

        await ctx.SaveChangesAsync();
    }

    public override async Task DownAsync(ContentMigrationContext ctx)
    {
        // Delete all content first
        var singletonTypes = new[]
        {
            "site-config", "navigation", "hero", "gallery",
            "events-page", "find-us", "more-page", "footer"
        };

        foreach (var entityType in singletonTypes)
        {
            await ctx.DeleteContentAsync(PortfolioId, entityType, "default");
        }

        // Delete menu categories
        var categorySlugs = new[] { "kabobs", "wraps", "fries", "drinks", "specials" };
        foreach (var slug in categorySlugs)
        {
            await ctx.DeleteContentAsync(PortfolioId, "menu-category", slug);
        }

        // Delete menu items
        var itemSlugs = new[]
        {
            "chicken-kabob", "beef-kabob", "lamb-kabob", "veggie-skewers",
            "loaded-fries-kabob", "kabob-wrap", "signature-drinks",
            "chicken-wrap", "beef-wrap", "falafel-wrap",
            "loaded-fries", "cheese-fries", "plain-fries",
            "pinchos-punch", "hibiscus-lemonade", "mango-iced-tea",
            "family-platter", "date-night-combo"
        };
        foreach (var slug in itemSlugs)
        {
            await ctx.DeleteContentAsync(PortfolioId, "menu-item", slug);
        }

        // Then delete definitions
        var allEntityTypes = new[]
        {
            "site-config", "navigation", "hero", "menu-category", "menu-item",
            "gallery", "events-page", "find-us", "more-page", "footer"
        };

        foreach (var entityType in allEntityTypes)
        {
            await ctx.DeleteEntityDefinitionAsync(PortfolioId, entityType);
        }

        await ctx.SaveChangesAsync();
    }
}
