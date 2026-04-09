using Microsoft.EntityFrameworkCore;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Services;

public class StripeWebhookService
{
    private readonly TinyToesDbContext _db;
    private readonly GraphEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeWebhookService> _logger;

    public StripeWebhookService(
        TinyToesDbContext db,
        GraphEmailService emailService,
        IConfiguration configuration,
        ILogger<StripeWebhookService> logger)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> HandleCheckoutCompletedAsync(string customerEmail, string? customerName, string? stripeCustomerId)
    {
        var normalizedEmail = customerEmail.Trim().ToLowerInvariant();

        // Generate claim code
        var code = CodeGenerator.Generate();

        // Ensure uniqueness
        while (await _db.ClaimCodes.AnyAsync(c => c.Code == code))
            code = CodeGenerator.Generate();

        var claimCode = new ClaimCode
        {
            Id = Guid.NewGuid(),
            Code = code,
            Status = ClaimCodeStatus.Unclaimed,
            CreatedAt = DateTime.UtcNow
        };
        _db.ClaimCodes.Add(claimCode);
        await _db.SaveChangesAsync();

        // Send claim code email via Graph API
        try
        {
            var frontendUrl = _configuration["FRONTEND_ORIGIN"]
                ?? _configuration["Cors:AllowedOrigins"]?.Split(',')[0]
                ?? "https://tinytoes.example.com";

            await _emailService.SendClaimCodeEmailAsync(
                normalizedEmail,
                customerName ?? "",
                code,
                frontendUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send claim code email to {Email}. Code: {Code}", normalizedEmail, code);
            // Don't throw — the code is saved in the DB and can be resent via admin
        }

        return code;
    }
}
