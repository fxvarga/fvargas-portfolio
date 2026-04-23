using TinyToes.Api.Services;

namespace TinyToes.Api.Endpoints;

public static class LuluWebhookEndpoints
{
    public static void MapLuluWebhookEndpoints(this WebApplication app)
    {
        app.MapPost("/api/webhooks/lulu", async (
            HttpContext context,
            LuluWebhookService webhookService,
            ILogger<LuluWebhookService> logger) =>
        {
            var payload = await new StreamReader(context.Request.Body).ReadToEndAsync();
            var signature = context.Request.Headers["Lulu-HMAC-SHA256"].ToString();

            if (!string.IsNullOrEmpty(signature) && !webhookService.VerifySignature(payload, signature))
            {
                logger.LogWarning("Lulu webhook signature verification failed");
                return Results.BadRequest(new { error = "Invalid signature." });
            }

            logger.LogInformation("Lulu webhook received");

            try
            {
                await webhookService.HandleStatusChangeAsync(payload);
                return Results.Ok(new { received = true });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing Lulu webhook");
                return Results.StatusCode(500);
            }
        });
    }
}
