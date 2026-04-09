using Stripe;
using Stripe.Checkout;

namespace TinyToes.Api.Endpoints;

public static class CheckoutEndpoints
{
    public static void MapCheckoutEndpoints(this WebApplication app)
    {
        app.MapPost("/api/checkout", (IConfiguration config, HttpContext context) =>
        {
            var secretKey = config["STRIPE_SECRET_KEY"] ?? config["Stripe:SecretKey"];
            var priceId = config["STRIPE_PRICE_ID"] ?? config["Stripe:PriceId"];
            var frontendOrigin = config["Cors:AllowedOrigins"]
                ?? config["FRONTEND_ORIGIN"]
                ?? "http://localhost:3456";

            // Use first origin if comma-separated
            var origin = frontendOrigin.Split(',')[0].Trim();

            if (string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(priceId))
                return Results.StatusCode(503);

            StripeConfiguration.ApiKey = secretKey;

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = ["card"],
                LineItems =
                [
                    new SessionLineItemOptions
                    {
                        Price = priceId,
                        Quantity = 1,
                    }
                ],
                Mode = "payment",
                SuccessUrl = $"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = $"{origin}/checkout/cancel",
                CustomerCreation = "always",
            };

            var service = new SessionService();
            var session = service.Create(options);

            return Results.Ok(new { url = session.Url });
        });
    }
}
