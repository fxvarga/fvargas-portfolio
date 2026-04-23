using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Services;

/// <summary>
/// Handles incoming Lulu webhooks (PRINT_JOB_STATUS_CHANGED).
/// Verifies HMAC-SHA256 signature and updates order/print job status.
/// </summary>
public class LuluWebhookService
{
    private readonly TinyToesDbContext _db;
    private readonly OrderEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LuluWebhookService> _logger;

    public LuluWebhookService(
        TinyToesDbContext db,
        OrderEmailService emailService,
        IConfiguration configuration,
        ILogger<LuluWebhookService> logger)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Verify the HMAC-SHA256 signature from the Lulu-HMAC-SHA256 header.
    /// </summary>
    public bool VerifySignature(string payload, string signature)
    {
        var secret = _configuration["LULU_WEBHOOK_SECRET"];
        if (string.IsNullOrEmpty(secret))
        {
            _logger.LogWarning("LULU_WEBHOOK_SECRET not configured — skipping signature verification");
            return true; // Allow in dev/sandbox when secret not yet configured
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computedSignature = Convert.ToHexString(computedHash).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedSignature),
            Encoding.UTF8.GetBytes(signature.ToLowerInvariant()));
    }

    /// <summary>
    /// Process a PRINT_JOB_STATUS_CHANGED webhook event.
    /// </summary>
    public async Task HandleStatusChangeAsync(string payload)
    {
        var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;

        if (!root.TryGetProperty("id", out var idProp))
        {
            _logger.LogWarning("Lulu webhook missing 'id' field");
            return;
        }

        var luluPrintJobId = idProp.GetInt64();
        var newStatus = root.TryGetProperty("status", out var statusProp)
            && statusProp.TryGetProperty("name", out var nameProp)
                ? nameProp.GetString() ?? "UNKNOWN"
                : "UNKNOWN";

        // Extract tracking URLs if present
        string? trackingUrlsJson = null;
        if (root.TryGetProperty("line_items", out var lineItems) && lineItems.GetArrayLength() > 0)
        {
            var firstItem = lineItems[0];
            if (firstItem.TryGetProperty("tracking_urls", out var trackingUrls))
            {
                trackingUrlsJson = trackingUrls.GetRawText();
            }
        }

        _logger.LogInformation("Lulu webhook: PrintJob {Id} -> {Status}", luluPrintJobId, newStatus);

        // Update our records
        var printJob = await _db.LuluPrintJobs
            .Include(j => j.Order)
            .ThenInclude(o => o.StatusToken)
            .FirstOrDefaultAsync(j => j.LuluPrintJobId == luluPrintJobId);

        if (printJob is null)
        {
            _logger.LogWarning("Lulu webhook for unknown print job: {Id}", luluPrintJobId);
            return;
        }

        printJob.Status = newStatus;
        printJob.LastStatusAt = DateTime.UtcNow;
        printJob.RawPayload = payload;

        if (!string.IsNullOrEmpty(trackingUrlsJson))
            printJob.TrackingUrls = trackingUrlsJson;

        // Map Lulu status to our order status
        printJob.Order.Status = newStatus switch
        {
            "CREATED" or "UNPAID" => OrderStatus.PrintJobCreated,
            "PAYMENT_IN_PROGRESS" or "PRODUCTION_READY" => OrderStatus.PrintJobCreated,
            "IN_PRODUCTION" or "PRODUCTION_DELAYED" => OrderStatus.InProduction,
            "SHIPPED" => OrderStatus.Shipped,
            "DELIVERED" => OrderStatus.Delivered,
            "CANCELED" => OrderStatus.Canceled,
            "REJECTED" or "ERROR" => OrderStatus.Error,
            _ => printJob.Order.Status
        };
        printJob.Order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Send email notifications for key status changes
        var token = printJob.Order.StatusToken?.Token;
        var statusUrl = token is not null ? BuildStatusUrl(token) : null;

        switch (newStatus)
        {
            case "IN_PRODUCTION":
                await _emailService.SendOrderInProductionEmailAsync(
                    printJob.Order.Email, printJob.Order.ProductSlug, statusUrl);
                break;
            case "SHIPPED":
                await _emailService.SendOrderShippedEmailAsync(
                    printJob.Order.Email, printJob.Order.ProductSlug,
                    trackingUrlsJson, statusUrl);
                break;
            case "DELIVERED":
                await _emailService.SendOrderDeliveredEmailAsync(
                    printJob.Order.Email, printJob.Order.ProductSlug, statusUrl);
                break;
            case "REJECTED" or "ERROR":
                _logger.LogError("Print job {Id} failed with status {Status}", luluPrintJobId, newStatus);
                break;
        }
    }

    private string BuildStatusUrl(string token)
    {
        var frontendUrl = _configuration["FRONTEND_ORIGIN"]
            ?? _configuration["Cors:AllowedOrigins"]?.Split(',')[0]
            ?? "https://tinytoes.fernando-vargas.com";
        return $"{frontendUrl.TrimEnd('/')}/print-order/{token}";
    }
}
