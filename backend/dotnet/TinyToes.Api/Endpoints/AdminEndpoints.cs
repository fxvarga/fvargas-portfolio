using Microsoft.EntityFrameworkCore;
using Stripe;
using TinyToes.Api.Services;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin");

        group.AddEndpointFilter(async (context, next) =>
        {
            var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var adminKey = config["ADMIN_API_KEY"];
            var providedKey = context.HttpContext.Request.Headers["X-Admin-Key"].FirstOrDefault();

            if (string.IsNullOrEmpty(adminKey) || providedKey != adminKey)
                return Results.Unauthorized();

            return await next(context);
        });

        group.MapPost("/codes", async (GenerateCodesRequest request, TinyToesDbContext db) =>
        {
            var productSlug = request.ProductSlug ?? "first-foods";

            // Validate the product slug exists
            var productExists = await db.Products.AnyAsync(p => p.Slug == productSlug);
            if (!productExists)
                return Results.BadRequest(new { error = $"Product '{productSlug}' not found." });

            var count = Math.Clamp(request.Count, 1, 100);
            var codes = new List<ClaimCode>();

            for (int i = 0; i < count; i++)
            {
                string code;
                do { code = CodeGenerator.Generate(); }
                while (await db.ClaimCodes.AnyAsync(c => c.Code == code));

                codes.Add(new ClaimCode
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    ProductSlug = productSlug,
                    Status = ClaimCodeStatus.Unclaimed,
                    CreatedAt = DateTime.UtcNow
                });
            }

            db.ClaimCodes.AddRange(codes);
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                productSlug,
                generated = codes.Select(c => c.Code).ToList()
            });
        });

        group.MapGet("/codes", async (TinyToesDbContext db, string? status, string? product) =>
        {
            var query = db.ClaimCodes.AsQueryable();

            if (Enum.TryParse<ClaimCodeStatus>(status, true, out var parsedStatus))
                query = query.Where(c => c.Status == parsedStatus);

            if (!string.IsNullOrEmpty(product))
                query = query.Where(c => c.ProductSlug == product);

            var codes = await query
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Code,
                    status = c.Status.ToString(),
                    c.ProductSlug,
                    c.BuyerEmail,
                    c.ClaimedAt,
                    c.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(codes);
        });

        // Stripe product setup: creates Stripe products/prices for all products missing a StripePriceId
        group.MapPost("/setup-stripe-products", async (TinyToesDbContext db, IConfiguration config, ILogger<TinyToesDbContext> logger) =>
        {
            var secretKey = config["STRIPE_SECRET_KEY"] ?? config["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(secretKey))
                return Results.StatusCode(503);

            StripeConfiguration.ApiKey = secretKey;

            var products = await db.Products
                .Where(p => p.IsActive && string.IsNullOrEmpty(p.StripePriceId))
                .ToListAsync();

            if (products.Count == 0)
                return Results.Ok(new { message = "All products already have Stripe prices configured." });

            var created = new List<object>();
            var productService = new ProductService();
            var priceService = new PriceService();

            foreach (var product in products)
            {
                // Create the Stripe product
                var stripeProduct = productService.Create(new ProductCreateOptions
                {
                    Name = product.Name,
                    Description = product.Description,
                    Metadata = new Dictionary<string, string>
                    {
                        ["slug"] = product.Slug,
                        ["is_bundle"] = product.IsBundle.ToString()
                    }
                });

                // Create the Stripe price
                var stripePrice = priceService.Create(new PriceCreateOptions
                {
                    Product = stripeProduct.Id,
                    UnitAmount = (long)(product.PriceUsd * 100), // cents
                    Currency = "usd",
                });

                // Save the price ID back
                product.StripePriceId = stripePrice.Id;

                created.Add(new
                {
                    product.Slug,
                    product.Name,
                    product.PriceUsd,
                    stripeProductId = stripeProduct.Id,
                    stripePriceId = stripePrice.Id
                });

                logger.LogInformation("Created Stripe product/price for {Slug}: {PriceId}", product.Slug, stripePrice.Id);
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { created });
        });

        // List products with their Stripe status
        group.MapGet("/products", async (TinyToesDbContext db) =>
        {
            var products = await db.Products
                .OrderBy(p => p.SortOrder)
                .Select(p => new
                {
                    p.Slug,
                    p.Name,
                    p.Description,
                    p.PriceUsd,
                    p.StripePriceId,
                    p.IsBundle,
                    p.BundleProductSlugs,
                    p.IsActive,
                    p.SortOrder,
                    hasStripePrice = !string.IsNullOrEmpty(p.StripePriceId)
                })
                .ToListAsync();

            return Results.Ok(products);
        });

        // Retry a failed print order
        group.MapPost("/orders/{orderId}/retry", async (Guid orderId, StripeWebhookService webhookService) =>
        {
            try
            {
                var result = await webhookService.RetryFailedOrderAsync(orderId);
                if (result.Contains("not found") || result.Contains("not Error"))
                    return Results.BadRequest(new { error = result });
                return Results.Ok(new { message = result });
            }
            catch (Exception)
            {
                return Results.StatusCode(500);
            }
        });

        // List all print orders
        group.MapGet("/orders", async (TinyToesDbContext db, string? status) =>
        {
            var query = db.MemoryBookOrders
                .Include(o => o.ShippingAddress)
                .Include(o => o.PrintJob)
                .AsQueryable();

            if (Enum.TryParse<OrderStatus>(status, true, out var parsedStatus))
                query = query.Where(o => o.Status == parsedStatus);

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    o.Email,
                    status = o.Status.ToString(),
                    o.ProductSlug,
                    o.PageCount,
                    o.AmountCents,
                    o.ShippingLevel,
                    luluJobId = o.PrintJob != null ? o.PrintJob.LuluPrintJobId : null,
                    luluStatus = o.PrintJob != null ? o.PrintJob.Status : null,
                    o.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(orders);
        });

        // List buyer entitlements
        group.MapGet("/entitlements", async (TinyToesDbContext db, string? email) =>
        {
            var query = db.BuyerProducts
                .Include(bp => bp.Buyer)
                .AsQueryable();

            if (!string.IsNullOrEmpty(email))
                query = query.Where(bp => bp.Buyer.Email == email.Trim().ToLowerInvariant());

            var entitlements = await query
                .OrderByDescending(bp => bp.GrantedAt)
                .Select(bp => new
                {
                    buyerEmail = bp.Buyer.Email,
                    bp.ProductSlug,
                    bp.GrantedAt
                })
                .ToListAsync();

            return Results.Ok(entitlements);
        });
    }
}

public record GenerateCodesRequest(int Count = 10, string? ProductSlug = null);
