using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using TinyToes.Infrastructure;

namespace TinyToes.Api.Endpoints;

public static class CheckoutEndpoints
{
    public static void MapCheckoutEndpoints(this WebApplication app)
    {
        app.MapPost("/api/checkout", async (CheckoutRequest request, IConfiguration config, TinyToesDbContext db) =>
        {
            var secretKey = config["STRIPE_SECRET_KEY"] ?? config["Stripe:SecretKey"];
            var frontendOrigin = config["Cors:AllowedOrigins"]
                ?? config["FRONTEND_ORIGIN"]
                ?? "http://localhost:3456";

            var origin = frontendOrigin.Split(',')[0].Trim();

            if (string.IsNullOrEmpty(secretKey))
                return Results.StatusCode(503);

            // Look up the product by slug to get its Stripe price ID
            var productSlug = request.ProductSlug ?? "first-foods";
            var product = await db.Products.FirstOrDefaultAsync(p => p.Slug == productSlug && p.IsActive);

            if (product is null)
                return Results.BadRequest(new { error = $"Product '{productSlug}' not found." });

            if (string.IsNullOrEmpty(product.StripePriceId))
                return Results.StatusCode(503); // Price not yet configured in Stripe

            StripeConfiguration.ApiKey = secretKey;

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = ["card"],
                LineItems =
                [
                    new SessionLineItemOptions
                    {
                        Price = product.StripePriceId,
                        Quantity = 1,
                    }
                ],
                Mode = "payment",
                SuccessUrl = $"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = $"{origin}/checkout/cancel",
                CustomerCreation = "always",
                Metadata = new Dictionary<string, string>
                {
                    ["product_slug"] = productSlug
                }
            };

            var service = new SessionService();
            var session = service.Create(options);

            return Results.Ok(new { url = session.Url });
        });

        // Public endpoint to get the product catalog
        app.MapGet("/api/products", async (TinyToesDbContext db) =>
        {
            var products = await db.Products
                .Where(p => p.IsActive)
                .OrderBy(p => p.SortOrder)
                .Select(p => new
                {
                    p.Slug,
                    p.Name,
                    p.Description,
                    p.PriceUsd,
                    p.IsBundle,
                    p.IsPhysical,
                    bundleIncludes = p.IsBundle ? p.BundleProductSlugs : null,
                    isAvailable = !string.IsNullOrEmpty(p.StripePriceId),
                    p.LuluPodPackageId,
                    p.MinPages,
                    p.MaxPages
                })
                .ToListAsync();

            return Results.Ok(products);
        });
    }
}

public record CheckoutRequest(string? ProductSlug);
