using TinyToes.Api.Services;

namespace TinyToes.Api.Endpoints;

public static class ClaimEndpoints
{
    public static void MapClaimEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api");

        group.MapPost("/claim", async (ClaimRequest request, ClaimService claimService, HttpContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
                return Results.BadRequest(new { error = "Email and claim code are required." });

            var result = await claimService.ClaimAsync(request.Email, request.Code);

            if (!result.IsSuccess)
                return Results.BadRequest(new { error = result.Error });

            context.Response.Cookies.Append("tinytoes_session", result.Token!, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = result.ExpiresAt,
                Path = "/api"
            });

            return Results.Ok(new { email = result.Email });
        }).RequireRateLimiting("claim");

        group.MapGet("/session", async (ClaimService claimService, HttpContext context) =>
        {
            var token = context.Request.Cookies["tinytoes_session"];
            if (string.IsNullOrEmpty(token))
                return Results.Unauthorized();

            var session = await claimService.ValidateSessionAsync(token);
            if (session is null)
                return Results.Unauthorized();

            return Results.Ok(new { email = session.Email, createdAt = session.CreatedAt });
        });

        group.MapGet("/entitlements", async (ClaimService claimService, HttpContext context) =>
        {
            var token = context.Request.Cookies["tinytoes_session"];
            if (string.IsNullOrEmpty(token))
                return Results.Unauthorized();

            var session = await claimService.ValidateSessionAsync(token);
            if (session is null)
                return Results.Unauthorized();

            var products = await claimService.GetEntitlementsAsync(session.BuyerId);

            return Results.Ok(new { products });
        });

        group.MapPost("/logout", async (ClaimService claimService, HttpContext context) =>
        {
            var token = context.Request.Cookies["tinytoes_session"];
            if (!string.IsNullOrEmpty(token))
            {
                await claimService.LogoutAsync(token);
            }

            context.Response.Cookies.Delete("tinytoes_session", new CookieOptions
            {
                Path = "/api"
            });

            return Results.Ok(new { message = "Logged out." });
        });
    }
}

public record ClaimRequest(string Email, string Code);
