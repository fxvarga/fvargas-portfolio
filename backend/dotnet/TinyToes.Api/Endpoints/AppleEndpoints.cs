using TinyToes.Api.Services;

namespace TinyToes.Api.Endpoints;

public static class AppleEndpoints
{
    public static void MapAppleEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/apple");

        // Verify an Apple IAP transaction and grant entitlements
        group.MapPost("/verify", async (
            AppleVerifyRequest request,
            AppleVerificationService appleService,
            ClaimService claimService,
            HttpContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.TransactionId))
                return Results.BadRequest(new { error = "Transaction ID is required." });

            // Require an authenticated session
            var token = context.Request.Cookies["tinytoes_session"];
            if (string.IsNullOrEmpty(token))
                return Results.Unauthorized();

            var session = await claimService.ValidateSessionAsync(token);
            if (session is null)
                return Results.Unauthorized();

            var result = await appleService.VerifyAndGrantAsync(request.TransactionId, session.BuyerId);

            if (!result.IsSuccess)
                return Results.BadRequest(new { error = result.Error });

            // Return updated entitlements
            var products = await claimService.GetEntitlementsAsync(session.BuyerId);
            return Results.Ok(new { products });
        });
    }
}

public record AppleVerifyRequest(string TransactionId);
