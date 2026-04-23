using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Infrastructure.Seed;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TinyToesDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<TinyToesDbContext>>();

        await context.Database.MigrateAsync();

        // Seed product catalog
        await SeedProductsAsync(context, logger);

        // Seed physical print book products (independent of initial seed)
        await SeedPrintProductsAsync(context, logger);

        // Deactivate memory-book and year-recap (now free features)
        await DeactivateFreeFeaturesAsync(context, logger);

        // Seed dev claim codes (one per product) if no codes exist
        await SeedDevCodesAsync(context, logger);

        // Migrate legacy data: grant first-foods to existing buyers without entitlements
        await MigrateLegacyBuyersAsync(context, logger);
    }

    private static async Task SeedProductsAsync(TinyToesDbContext context, ILogger logger)
    {
        if (await context.Products.AnyAsync())
            return;

        var products = new List<Product>
        {
            new()
            {
                ProductId = Guid.NewGuid(),
                Slug = "first-foods",
                Name = "First Foods Tracker",
                Description = "Track your baby's first bites and reactions with photos",
                PriceUsd = 4.99m,
                IsBundle = false,
                SortOrder = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                ProductId = Guid.NewGuid(),
                Slug = "milestones",
                Name = "Milestone Tracker",
                Description = "Capture every first moment — from first smile to first steps",
                PriceUsd = 4.99m,
                IsBundle = false,
                SortOrder = 2,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                ProductId = Guid.NewGuid(),
                Slug = "monthly-journal",
                Name = "Monthly Memory Journal",
                Description = "Capture your baby's life month by month with photos and stories",
                PriceUsd = 4.99m,
                IsBundle = false,
                SortOrder = 3,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                ProductId = Guid.NewGuid(),
                Slug = "first-year-bundle",
                Name = "First Year Bundle",
                Description = "All 3 core products — track foods, milestones, and journal memories. Memory Book & Year Recap included free.",
                PriceUsd = 9.99m,
                IsBundle = true,
                BundleProductSlugs = "first-foods,milestones,monthly-journal",
                SortOrder = 0,
                CreatedAt = DateTime.UtcNow
            }
        };

        context.Products.AddRange(products);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} products", products.Count);
    }

    private static async Task SeedPrintProductsAsync(TinyToesDbContext context, ILogger logger)
    {
        var printSlugs = new[] { "print-softcover", "print-hardcover", "print-premium" };
        var existingCount = await context.Products.CountAsync(p => printSlugs.Contains(p.Slug));
        if (existingCount == printSlugs.Length)
            return;

        var printProducts = new List<Product>
        {
            new()
            {
                ProductId = Guid.NewGuid(),
                Slug = "print-softcover",
                Name = "Keepsake Softcover Book",
                Description = "6x9 perfect-bound softcover with matte finish. Includes digital bundle.",
                PriceUsd = 29.99m,
                IsBundle = false,
                IsPhysical = true,
                LuluPodPackageId = "0600X0900BWSTDPB060UW444MXX",
                MinPages = 32,
                MaxPages = 200,
                SortOrder = 10,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                ProductId = Guid.NewGuid(),
                Slug = "print-hardcover",
                Name = "Heirloom Hardcover Book",
                Description = "8.5x8.5 casebound hardcover with matte finish. Includes digital bundle.",
                PriceUsd = 49.99m,
                IsBundle = false,
                IsPhysical = true,
                LuluPodPackageId = "0850X0850FCSTDCW080CW444MXX",
                MinPages = 32,
                MaxPages = 200,
                SortOrder = 11,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                ProductId = Guid.NewGuid(),
                Slug = "print-premium",
                Name = "Linen Premium Hardcover Book",
                Description = "8.5x11 linen casebound with foil-stamped title. Includes digital bundle.",
                PriceUsd = 79.99m,
                IsBundle = false,
                IsPhysical = true,
                LuluPodPackageId = "0850X1100FCSTDCW080CW444MXX",
                MinPages = 32,
                MaxPages = 200,
                SortOrder = 12,
                CreatedAt = DateTime.UtcNow
            }
        };

        // Only add missing ones
        foreach (var p in printProducts)
        {
            if (!await context.Products.AnyAsync(x => x.Slug == p.Slug))
                context.Products.Add(p);
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Seeded print book products");
    }

    private static async Task DeactivateFreeFeaturesAsync(TinyToesDbContext context, ILogger logger)
    {
        // Deactivate memory-book and year-recap — they are now free features
        var slugsToDeactivate = new[] { "memory-book", "year-recap" };
        var productsToDeactivate = await context.Products
            .Where(p => slugsToDeactivate.Contains(p.Slug) && p.IsActive)
            .ToListAsync();

        foreach (var product in productsToDeactivate)
        {
            product.IsActive = false;
        }

        // Update the bundle: remove memory-book and year-recap, update price
        var bundle = await context.Products.FirstOrDefaultAsync(p => p.Slug == "first-year-bundle");
        if (bundle is not null)
        {
            bundle.BundleProductSlugs = "first-foods,milestones,monthly-journal";
            bundle.PriceUsd = 9.99m;
            bundle.Description = "All 3 core products — track foods, milestones, and journal memories. Memory Book & Year Recap included free.";
        }

        if (productsToDeactivate.Count > 0 || bundle is not null)
        {
            await context.SaveChangesAsync();
            if (productsToDeactivate.Count > 0)
                logger.LogInformation("Deactivated {Count} free-feature products: {Slugs}",
                    productsToDeactivate.Count, string.Join(", ", productsToDeactivate.Select(p => p.Slug)));
            if (bundle is not null)
                logger.LogInformation("Updated bundle to 3 core products at $9.99");
        }
    }

    private static async Task SeedDevCodesAsync(TinyToesDbContext context, ILogger logger)
    {
        if (await context.ClaimCodes.AnyAsync())
            return;

        var slugs = new[] { "first-foods", "milestones", "monthly-journal", "first-year-bundle" };
        var codes = new List<ClaimCode>();

        for (int i = 0; i < slugs.Length; i++)
        {
            codes.Add(new ClaimCode
            {
                Id = Guid.NewGuid(),
                Code = $"TINY-DEV0-{(i + 1):D4}",
                ProductSlug = slugs[i],
                Status = ClaimCodeStatus.Unclaimed,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Add a few extra first-foods codes for testing
        for (int i = 7; i <= 10; i++)
        {
            codes.Add(new ClaimCode
            {
                Id = Guid.NewGuid(),
                Code = $"TINY-DEV0-{i:D4}",
                ProductSlug = "first-foods",
                Status = ClaimCodeStatus.Unclaimed,
                CreatedAt = DateTime.UtcNow
            });
        }

        context.ClaimCodes.AddRange(codes);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} dev claim codes", codes.Count);
    }

    private static async Task MigrateLegacyBuyersAsync(TinyToesDbContext context, ILogger logger)
    {
        // Find buyers who have claimed codes but no BuyerProduct entitlements
        var buyersWithoutEntitlements = await context.Buyers
            .Where(b => !context.BuyerProducts.Any(bp => bp.BuyerId == b.BuyerId))
            .Where(b => context.ClaimCodes.Any(c => c.BuyerId == b.BuyerId && c.Status == ClaimCodeStatus.Claimed))
            .ToListAsync();

        if (buyersWithoutEntitlements.Count == 0)
            return;

        foreach (var buyer in buyersWithoutEntitlements)
        {
            context.BuyerProducts.Add(new BuyerProduct
            {
                BuyerProductId = Guid.NewGuid(),
                BuyerId = buyer.BuyerId,
                ProductSlug = "first-foods",
                GrantedAt = buyer.CreatedAt
            });
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Migrated {Count} legacy buyers to first-foods entitlement", buyersWithoutEntitlements.Count);
    }
}
