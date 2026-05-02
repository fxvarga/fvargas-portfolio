using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Services;

/// <summary>
/// Verifies Apple In-App Purchase transactions using the App Store Server API v2.
/// On success, grants the "first-year-bundle" entitlements to the buyer.
/// </summary>
public class AppleVerificationService
{
    private readonly TinyToesDbContext _db;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<AppleVerificationService> _logger;

    // Apple's bundle product mapping
    private const string BundleSlug = "first-year-bundle";
    private static readonly string[] BundleProducts = ["first-foods", "milestones", "monthly-journal"];

    public AppleVerificationService(
        TinyToesDbContext db,
        IConfiguration config,
        IHttpClientFactory httpFactory,
        ILogger<AppleVerificationService> logger)
    {
        _db = db;
        _config = config;
        _httpFactory = httpFactory;
        _logger = logger;
    }

    public async Task<AppleVerifyResult> VerifyAndGrantAsync(string transactionId, Guid buyerId)
    {
        // 1. Check if this transaction was already processed
        var existing = await _db.BuyerProducts
            .AnyAsync(bp => bp.AppleTransactionId == transactionId);
        if (existing)
        {
            _logger.LogInformation("Apple transaction {Txn} already processed", transactionId);
            return AppleVerifyResult.Success();
        }

        // 2. Verify with Apple
        var transaction = await GetTransactionFromApple(transactionId);
        if (transaction is null)
            return AppleVerifyResult.Fail("Could not verify transaction with Apple.");

        // 3. Validate the product ID matches our expected IAP
        if (transaction.ProductId != "com.tinytoes.app.firstyearbundle")
        {
            _logger.LogWarning("Unexpected Apple product ID: {ProductId}", transaction.ProductId);
            return AppleVerifyResult.Fail("Unexpected product.");
        }

        // 4. Grant entitlements
        var existingSlugs = await _db.BuyerProducts
            .Where(bp => bp.BuyerId == buyerId)
            .Select(bp => bp.ProductSlug)
            .ToListAsync();

        foreach (var slug in BundleProducts.Where(s => !existingSlugs.Contains(s)))
        {
            _db.BuyerProducts.Add(new BuyerProduct
            {
                BuyerProductId = Guid.NewGuid(),
                BuyerId = buyerId,
                ProductSlug = slug,
                Source = "apple",
                AppleTransactionId = transactionId,
                GrantedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Granted Apple IAP entitlements for buyer {BuyerId}, txn {Txn}", buyerId, transactionId);
        return AppleVerifyResult.Success();
    }

    private async Task<AppleTransactionInfo?> GetTransactionFromApple(string transactionId)
    {
        var useSandbox = _config.GetValue("Apple:UseSandbox", true);
        var baseUrl = useSandbox
            ? "https://api.storekit-sandbox.itunes.apple.com"
            : "https://api.storekit.itunes.apple.com";

        try
        {
            var jwt = GenerateAppleJwt();
            var client = _httpFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

            var response = await client.GetAsync($"{baseUrl}/inApps/v1/transactions/{transactionId}");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Apple API returned {Status} for txn {Txn}", response.StatusCode, transactionId);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var envelope = JsonSerializer.Deserialize<AppleTransactionResponse>(json);
            if (envelope?.SignedTransactionInfo is null)
                return null;

            // The signedTransactionInfo is a JWS — decode the payload (middle part)
            var parts = envelope.SignedTransactionInfo.Split('.');
            if (parts.Length != 3) return null;

            var payloadJson = Encoding.UTF8.GetString(Base64UrlDecode(parts[1]));
            return JsonSerializer.Deserialize<AppleTransactionInfo>(payloadJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify Apple transaction {Txn}", transactionId);
            return null;
        }
    }

    private string GenerateAppleJwt()
    {
        var keyId = _config["Apple:KeyId"]
            ?? throw new InvalidOperationException("Apple:KeyId not configured");
        var issuerId = _config["Apple:IssuerId"]
            ?? throw new InvalidOperationException("Apple:IssuerId not configured");
        var privateKeyPem = _config["Apple:PrivateKey"]
            ?? throw new InvalidOperationException("Apple:PrivateKey not configured");

        var ecdsa = ECDsa.Create();
        ecdsa.ImportFromPem(privateKeyPem);
        var securityKey = new ECDsaSecurityKey(ecdsa) { KeyId = keyId };

        var now = DateTime.UtcNow;
        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = issuerId,
            IssuedAt = now,
            Expires = now.AddMinutes(20),
            Audience = "appstoreconnect-v1",
            SigningCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.EcdsaSha256)
        };

        // Add kid and typ to header
        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateJwtSecurityToken(descriptor);
        token.Header["kid"] = keyId;

        return handler.WriteToken(token);
    }

    private static byte[] Base64UrlDecode(string input)
    {
        var s = input.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4)
        {
            case 2: s += "=="; break;
            case 3: s += "="; break;
        }
        return Convert.FromBase64String(s);
    }
}

public record AppleVerifyResult(bool IsSuccess, string? Error)
{
    public static AppleVerifyResult Success() => new(true, null);
    public static AppleVerifyResult Fail(string error) => new(false, error);
}

// DTOs for Apple API (internal to avoid leaking outside assembly)
internal class AppleTransactionResponse
{
    [JsonPropertyName("signedTransactionInfo")]
    public string? SignedTransactionInfo { get; set; }
}

internal class AppleTransactionInfo
{
    [JsonPropertyName("productId")]
    public string? ProductId { get; set; }

    [JsonPropertyName("originalTransactionId")]
    public string? OriginalTransactionId { get; set; }

    [JsonPropertyName("bundleId")]
    public string? BundleId { get; set; }
}
