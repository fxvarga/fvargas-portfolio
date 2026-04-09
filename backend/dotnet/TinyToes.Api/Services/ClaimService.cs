using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Services;

public class ClaimService
{
    private readonly TinyToesDbContext _db;

    public ClaimService(TinyToesDbContext db)
    {
        _db = db;
    }

    public async Task<ClaimResult> ClaimAsync(string email, string code)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedCode = code.Trim().ToUpperInvariant();

        var claimCode = await _db.ClaimCodes
            .Include(c => c.Buyer)
            .FirstOrDefaultAsync(c => c.Code == normalizedCode);

        if (claimCode is null)
            return ClaimResult.Fail("Invalid claim code.");

        // Already claimed by a DIFFERENT email
        if (claimCode.Status == ClaimCodeStatus.Claimed &&
            claimCode.BuyerEmail != null &&
            !claimCode.BuyerEmail.Equals(normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            return ClaimResult.Fail("This code has already been claimed by another account.");
        }

        // Find or create buyer
        var buyer = await _db.Buyers.FirstOrDefaultAsync(b => b.Email == normalizedEmail);
        if (buyer is null)
        {
            buyer = new Buyer
            {
                BuyerId = Guid.NewGuid(),
                Email = normalizedEmail,
                CreatedAt = DateTime.UtcNow
            };
            _db.Buyers.Add(buyer);
        }

        // Claim the code if unclaimed
        if (claimCode.Status == ClaimCodeStatus.Unclaimed)
        {
            claimCode.Status = ClaimCodeStatus.Claimed;
            claimCode.BuyerEmail = normalizedEmail;
            claimCode.BuyerId = buyer.BuyerId;
            claimCode.ClaimedAt = DateTime.UtcNow;
        }

        // Create session
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var session = new Session
        {
            SessionId = Guid.NewGuid(),
            BuyerId = buyer.BuyerId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(90),
            CreatedAt = DateTime.UtcNow
        };
        _db.Sessions.Add(session);

        await _db.SaveChangesAsync();

        return ClaimResult.Success(token, buyer.Email, session.ExpiresAt);
    }

    public async Task<SessionInfo?> ValidateSessionAsync(string token)
    {
        var session = await _db.Sessions
            .Include(s => s.Buyer)
            .FirstOrDefaultAsync(s => s.Token == token && s.ExpiresAt > DateTime.UtcNow);

        if (session is null) return null;

        return new SessionInfo(session.Buyer.Email, session.Buyer.CreatedAt);
    }

    public async Task LogoutAsync(string token)
    {
        var session = await _db.Sessions.FirstOrDefaultAsync(s => s.Token == token);
        if (session is not null)
        {
            _db.Sessions.Remove(session);
            await _db.SaveChangesAsync();
        }
    }
}

public record ClaimResult(bool IsSuccess, string? Token, string? Email, DateTime? ExpiresAt, string? Error)
{
    public static ClaimResult Success(string token, string email, DateTime expiresAt) =>
        new(true, token, email, expiresAt, null);
    public static ClaimResult Fail(string error) =>
        new(false, null, null, null, error);
}

public record SessionInfo(string Email, DateTime CreatedAt);
