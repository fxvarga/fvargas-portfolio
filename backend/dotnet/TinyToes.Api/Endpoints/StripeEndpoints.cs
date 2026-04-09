using Stripe;
using Stripe.Checkout;
using TinyToes.Api.Services;

namespace TinyToes.Api.Endpoints;

public static class StripeEndpoints
{
    public static void MapStripeEndpoints(this WebApplication app)
    {
        app.MapPost("/api/webhooks/stripe", async (HttpContext context, StripeWebhookService webhookService, IConfiguration config, ILogger<StripeWebhookService> logger) =>
        {
            var json = await new StreamReader(context.Request.Body).ReadToEndAsync();
            var webhookSecret = config["STRIPE_WEBHOOK_SECRET"];

            if (string.IsNullOrEmpty(webhookSecret))
            {
                logger.LogError("STRIPE_WEBHOOK_SECRET is not configured");
                return Results.StatusCode(500);
            }

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(json,
                    context.Request.Headers["Stripe-Signature"],
                    webhookSecret,
                    tolerance: 600, // 10 min tolerance for local dev
                    throwOnApiVersionMismatch: false);

                logger.LogInformation("Stripe webhook received: {EventType}, id={EventId}", stripeEvent.Type, stripeEvent.Id);

                if (stripeEvent.Type == EventTypes.CheckoutSessionCompleted)
                {
                    var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                    logger.LogInformation("Checkout session completed. Email={Email}, CustomerId={CustomerId}",
                        session?.CustomerDetails?.Email, session?.CustomerId);

                    if (session?.CustomerDetails?.Email is not null)
                    {
                        // Read the product slug from checkout session metadata
                        var productSlug = session.Metadata?.GetValueOrDefault("product_slug") ?? "first-foods";

                        var code = await webhookService.HandleCheckoutCompletedAsync(
                            session.CustomerDetails.Email,
                            session.CustomerDetails.Name,
                            session.CustomerId,
                            productSlug);

                        logger.LogInformation("Claim code generated: {Code} for {Email}, product={Product}",
                            code, session.CustomerDetails.Email, productSlug);
                        return Results.Ok(new { received = true, code });
                    }
                }

                return Results.Ok(new { received = true });
            }
            catch (StripeException ex)
            {
                logger.LogError(ex, "Stripe webhook signature validation failed. Secret length={SecretLen}, Signature={Sig}",
                    webhookSecret?.Length, context.Request.Headers["Stripe-Signature"].ToString()?[..Math.Min(50, context.Request.Headers["Stripe-Signature"].ToString().Length)]);
                return Results.BadRequest(new { error = "Invalid webhook signature." });
            }
        });
    }
}
