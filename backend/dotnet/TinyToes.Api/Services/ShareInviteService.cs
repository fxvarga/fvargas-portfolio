using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Services;

public class ShareInviteService
{
    private readonly TinyToesDbContext _db;
    private readonly ShareSecurityService _security;
    private readonly ShareCleanupService _cleanupService;
    private readonly GraphEmailService _emailService;
    private readonly ShareInviteOptions _options;
    private readonly AnalyticsService _analytics;

    public ShareInviteService(
        TinyToesDbContext db,
        ShareSecurityService security,
        ShareCleanupService cleanupService,
        GraphEmailService emailService,
        IOptions<ShareInviteOptions> options,
        AnalyticsService analytics)
    {
        _db = db;
        _security = security;
        _cleanupService = cleanupService;
        _emailService = emailService;
        _options = options.Value;
        _analytics = analytics;
    }

    public async Task ExpireInvitesAsync(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        var expirable = await _db.ShareInvites
            .Where(i => i.ExpiresAt <= now &&
                        i.Status != ShareInviteStatus.Consumed &&
                        i.Status != ShareInviteStatus.Expired &&
                        i.Status != ShareInviteStatus.Revoked)
            .ToListAsync(cancellationToken);

        if (expirable.Count == 0)
        {
            return;
        }

        foreach (var invite in expirable)
        {
            invite.Status = ShareInviteStatus.Expired;
            invite.LastError = "Invite expired before completion.";
            _analytics.Track("share_invite_expired", new Dictionary<string, string>
            {
                ["invite_id"] = invite.InviteId.ToString("N")
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<CreateShareInviteResult> CreateInviteAsync(Guid ownerUserId, string recipientEmail, CreateExportManifestRequest manifestRequest, CancellationToken cancellationToken)
    {
        var normalizedEmail = _security.NormalizeEmail(recipientEmail);
        var stateJsonString = manifestRequest.StateJson.GetRawText();
        var stateJsonBytes = Encoding.UTF8.GetByteCount(stateJsonString);
        var totalAssetBytes = manifestRequest.Assets.Sum(a => Math.Max(a.ByteSize, 0));
        var totalBytes = stateJsonBytes + totalAssetBytes;

        if (totalBytes > _options.MaxExportBytes)
        {
            return CreateShareInviteResult.Fail("export_too_large");
        }

        var now = DateTime.UtcNow;
        var expiresAt = now.AddDays(_options.InviteTtlDays);
        var exportId = Guid.NewGuid();
        var inviteId = Guid.NewGuid();

        var exportManifest = new ExportManifest
        {
            ExportId = exportId,
            SchemaVersion = manifestRequest.SchemaVersion,
            OwnerUserId = ownerUserId,
            StateJson = stateJsonString,
            TotalAssetBytes = totalAssetBytes,
            CreatedAt = now,
            Assets = manifestRequest.Assets.Select(a => new ExportManifestAsset
            {
                Id = Guid.NewGuid(),
                ExportId = exportId,
                AssetId = a.AssetId,
                Kind = string.IsNullOrWhiteSpace(a.Kind) ? "image" : a.Kind,
                CloudKitZoneName = a.CloudKitZoneName,
                CloudKitRecordName = a.CloudKitRecordName,
                CloudKitFieldName = a.CloudKitFieldName,
                FileName = a.FileName,
                ContentType = a.ContentType,
                Width = a.Width,
                Height = a.Height,
                Sha256 = a.Sha256,
                ByteSize = a.ByteSize,
                CreatedAt = now,
                ExpiresAt = expiresAt
            }).ToList()
        };

        var rawCode = _security.GenerateInviteCode();
        var codeHash = _security.HashCode(_security.NormalizeCode(rawCode));

        var shareInvite = new ShareInvite
        {
            InviteId = inviteId,
            OwnerUserId = ownerUserId,
            RecipientEmailNormalized = normalizedEmail,
            CodeHash = codeHash,
            ExportId = exportId,
            Status = ShareInviteStatus.Pending,
            CreatedAt = now,
            ExpiresAt = expiresAt
        };

        _db.ExportManifests.Add(exportManifest);
        _db.ShareInvites.Add(shareInvite);
        await _db.SaveChangesAsync(cancellationToken);

        _analytics.Track("share_invite_created", new Dictionary<string, string>
        {
            ["invite_id"] = inviteId.ToString("N")
        });

        var inviteLink = $"{_options.BaseUniversalLinkUrl.TrimEnd('/')}/{Uri.EscapeDataString(rawCode)}";
        await _emailService.SendShareInviteEmailAsync(
            recipientEmail: normalizedEmail,
            inviteCode: rawCode,
            inviteLink: inviteLink,
            appStoreLink: _options.AppStoreUrl,
            expiresAt: expiresAt);

        _analytics.Track("share_email_sent", new Dictionary<string, string>
        {
            ["invite_id"] = inviteId.ToString("N")
        });

        return CreateShareInviteResult.Success(inviteId, expiresAt);
    }

    public async Task<ShareInviteLookupResult> LookupInviteAsync(string code, CancellationToken cancellationToken)
    {
        var normalizedCode = _security.NormalizeCode(code);
        var codeHash = _security.HashCode(normalizedCode);

        var invite = await _db.ShareInvites
            .FirstOrDefaultAsync(i => i.CodeHash == codeHash, cancellationToken);

        _analytics.Track("share_code_lookup", new Dictionary<string, string>
        {
            ["result"] = invite is null ? "not_found" : "found"
        });

        if (invite is null)
        {
            return ShareInviteLookupResult.Invalid();
        }

        if (invite.ExpiresAt <= DateTime.UtcNow || invite.Status == ShareInviteStatus.Expired)
        {
            invite.Status = ShareInviteStatus.Expired;
            await _db.SaveChangesAsync(cancellationToken);
            return ShareInviteLookupResult.Expired(invite.InviteId, invite.ExpiresAt);
        }

        if (invite.Status == ShareInviteStatus.Consumed)
        {
            return ShareInviteLookupResult.Consumed(invite.InviteId, invite.ExpiresAt);
        }

        return ShareInviteLookupResult.Pending(
            invite.InviteId,
            invite.ExpiresAt,
            MaskEmail(invite.RecipientEmailNormalized));
    }

    public async Task RequestVerificationAsync(Guid inviteId, string email, CancellationToken cancellationToken)
    {
        var invite = await _db.ShareInvites.FirstOrDefaultAsync(i => i.InviteId == inviteId, cancellationToken);
        if (invite is null)
        {
            return;
        }

        var normalizedEmail = _security.NormalizeEmail(email);

        _analytics.Track("share_verification_requested", new Dictionary<string, string>
        {
            ["invite_id"] = inviteId.ToString("N")
        });

        if (invite.Status == ShareInviteStatus.Consumed || invite.Status == ShareInviteStatus.Expired || invite.ExpiresAt <= DateTime.UtcNow)
        {
            return;
        }

        if (!string.Equals(normalizedEmail, invite.RecipientEmailNormalized, StringComparison.Ordinal))
        {
            return;
        }

        var verificationToken = _security.GenerateOpaqueToken();
        invite.VerificationTokenHash = _security.HashToken(verificationToken);
        invite.VerificationTokenExpiresAt = DateTime.UtcNow.AddMinutes(_options.VerificationTokenMinutes);
        invite.VerificationTokenUsedAt = null;
        invite.Status = ShareInviteStatus.EmailVerificationSent;

        await _db.SaveChangesAsync(cancellationToken);

        var verifyLink = $"{_options.BaseUniversalLinkUrl.TrimEnd('/')}/verify?token={Uri.EscapeDataString(verificationToken)}";
        await _emailService.SendShareVerificationEmailAsync(normalizedEmail, verifyLink, invite.ExpiresAt);
    }

    public async Task<ShareVerifyResult> VerifyAsync(string token, CancellationToken cancellationToken)
    {
        var tokenHash = _security.HashToken(token);
        var invite = await _db.ShareInvites
            .FirstOrDefaultAsync(i => i.VerificationTokenHash == tokenHash, cancellationToken);

        if (invite is null || invite.VerificationTokenExpiresAt is null || invite.VerificationTokenExpiresAt <= DateTime.UtcNow)
        {
            return ShareVerifyResult.Fail("invalid_or_expired_token");
        }

        if (invite.VerificationTokenUsedAt is not null)
        {
            return ShareVerifyResult.Fail("token_already_used");
        }

        invite.VerificationTokenUsedAt = DateTime.UtcNow;
        invite.VerificationTokenHash = null;
        invite.VerificationTokenExpiresAt = null;

        var importToken = _security.GenerateOpaqueToken();
        invite.ImportTokenHash = _security.HashToken(importToken);
        invite.ImportTokenExpiresAt = DateTime.UtcNow.AddMinutes(_options.ImportTokenMinutes);
        invite.ImportTokenUsedAt = null;
        invite.Status = ShareInviteStatus.Verified;

        await _db.SaveChangesAsync(cancellationToken);

        _analytics.Track("share_email_verified", new Dictionary<string, string>
        {
            ["invite_id"] = invite.InviteId.ToString("N")
        });

        return ShareVerifyResult.Success(invite.InviteId, importToken);
    }

    public async Task<StartImportResult> StartImportAsync(Guid inviteId, Guid sessionBuyerId, string importToken, CancellationToken cancellationToken)
    {
        var invite = await _db.ShareInvites
            .Include(i => i.ExportManifest)
            .ThenInclude(m => m.Assets)
            .FirstOrDefaultAsync(i => i.InviteId == inviteId, cancellationToken);

        if (invite is null)
        {
            return StartImportResult.Fail("invalid_invite");
        }

        if (invite.ExpiresAt <= DateTime.UtcNow || invite.Status == ShareInviteStatus.Expired)
        {
            invite.Status = ShareInviteStatus.Expired;
            await _db.SaveChangesAsync(cancellationToken);
            return StartImportResult.Fail("invite_expired");
        }

        if (invite.Status == ShareInviteStatus.Consumed)
        {
            return StartImportResult.Fail("invite_already_used");
        }

        if (invite.ImportTokenHash is null || invite.ImportTokenExpiresAt is null || invite.ImportTokenExpiresAt <= DateTime.UtcNow)
        {
            return StartImportResult.Fail("invalid_import_token");
        }

        if (invite.ImportTokenUsedAt is not null)
        {
            return StartImportResult.Fail("import_token_already_used");
        }

        if (!_security.FixedTimeTokenEquals(importToken, invite.ImportTokenHash))
        {
            return StartImportResult.Fail("invalid_import_token");
        }

        invite.ImportTokenUsedAt = DateTime.UtcNow;
        invite.ImportTokenExpiresAt = DateTime.UtcNow.AddMinutes(_options.ImportTokenMinutes);
        invite.ImportTokenHash = _security.HashToken(importToken);
        invite.Status = ShareInviteStatus.Importing;
        invite.ImportStartedAt = DateTime.UtcNow;
        invite.ClaimedByUserId = sessionBuyerId;
        invite.ClaimedAt ??= DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        _analytics.Track("share_import_started", new Dictionary<string, string>
        {
            ["invite_id"] = invite.InviteId.ToString("N")
        });

        return StartImportResult.Success(
            invite.ExportId,
            invite.ExportManifest.SchemaVersion,
            invite.ExportManifest.StateJson,
            invite.ExportManifest.Assets
                .OrderBy(a => a.CreatedAt)
                .Select(a => new StartImportAsset(
                    a.AssetId,
                    a.CloudKitZoneName,
                    a.CloudKitRecordName,
                    a.CloudKitFieldName,
                    a.Sha256,
                    a.ContentType))
                .ToList());
    }

    public async Task<CompleteImportResult> CompleteImportAsync(Guid inviteId, Guid sessionBuyerId, string importToken, string result, CancellationToken cancellationToken)
    {
        var invite = await _db.ShareInvites
            .Include(i => i.ExportManifest)
            .FirstOrDefaultAsync(i => i.InviteId == inviteId, cancellationToken);

        if (invite is null)
        {
            return CompleteImportResult.Fail("invalid_invite");
        }

        if (invite.ClaimedByUserId != sessionBuyerId)
        {
            return CompleteImportResult.Fail("invite_claimed_by_other_user");
        }

        if (invite.ImportTokenHash is null || invite.ImportTokenExpiresAt is null || invite.ImportTokenExpiresAt <= DateTime.UtcNow)
        {
            return CompleteImportResult.Fail("invalid_import_token");
        }

        if (!_security.FixedTimeTokenEquals(importToken, invite.ImportTokenHash))
        {
            return CompleteImportResult.Fail("invalid_import_token");
        }

        if (!string.Equals(result, "success", StringComparison.OrdinalIgnoreCase))
        {
            invite.Status = ShareInviteStatus.Failed;
            invite.LastError = "Import failed on recipient client.";
            await _db.SaveChangesAsync(cancellationToken);

            _analytics.Track("share_import_failed", new Dictionary<string, string>
            {
                ["invite_id"] = invite.InviteId.ToString("N")
            });

            return CompleteImportResult.Fail("import_failed");
        }

        invite.Status = ShareInviteStatus.Consumed;
        invite.ConsumedAt = DateTime.UtcNow;
        invite.ImportTokenUsedAt = DateTime.UtcNow;
        invite.ImportTokenHash = null;
        invite.ImportTokenExpiresAt = null;
        invite.LastError = null;

        await _db.SaveChangesAsync(cancellationToken);
        await _cleanupService.TriggerTransferCleanupAsync(invite, cancellationToken);

        _analytics.Track("share_import_completed", new Dictionary<string, string>
        {
            ["invite_id"] = invite.InviteId.ToString("N")
        });

        return CompleteImportResult.Success();
    }

    private static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 0)
        {
            return "***";
        }

        var first = email[0];
        var domain = email[at..];
        return $"{first}***{domain}";
    }
}

public record CreateExportManifestRequest(int SchemaVersion, JsonElement StateJson, List<CreateExportAssetRequest> Assets);

public record CreateExportAssetRequest(
    string AssetId,
    string Kind,
    string CloudKitZoneName,
    string CloudKitRecordName,
    string CloudKitFieldName,
    string? FileName,
    string ContentType,
    int? Width,
    int? Height,
    string Sha256,
    long ByteSize);

public record CreateShareInviteResult(bool IsSuccess, Guid? InviteId, DateTime? ExpiresAt, string? Error)
{
    public static CreateShareInviteResult Success(Guid inviteId, DateTime expiresAt) => new(true, inviteId, expiresAt, null);
    public static CreateShareInviteResult Fail(string error) => new(false, null, null, error);
}

public record ShareInviteLookupResult(
    bool IsValid,
    bool IsExpired,
    bool IsConsumed,
    Guid? InviteId,
    DateTime? ExpiresAt,
    string? MaskedRecipientEmail)
{
    public static ShareInviteLookupResult Invalid() => new(false, false, false, null, null, null);
    public static ShareInviteLookupResult Expired(Guid inviteId, DateTime expiresAt) => new(false, true, false, inviteId, expiresAt, null);
    public static ShareInviteLookupResult Consumed(Guid inviteId, DateTime expiresAt) => new(false, false, true, inviteId, expiresAt, null);
    public static ShareInviteLookupResult Pending(Guid inviteId, DateTime expiresAt, string maskedEmail) => new(true, false, false, inviteId, expiresAt, maskedEmail);
}

public record ShareVerifyResult(bool IsSuccess, Guid? InviteId, string? ImportToken, string? Error)
{
    public static ShareVerifyResult Success(Guid inviteId, string importToken) => new(true, inviteId, importToken, null);
    public static ShareVerifyResult Fail(string error) => new(false, null, null, error);
}

public record StartImportAsset(
    string AssetId,
    string CloudKitZoneName,
    string CloudKitRecordName,
    string CloudKitFieldName,
    string Sha256,
    string ContentType);

public record StartImportResult(bool IsSuccess, Guid? ExportId, int? SchemaVersion, string? StateJson, List<StartImportAsset>? Assets, string? Error)
{
    public static StartImportResult Success(Guid exportId, int schemaVersion, string stateJson, List<StartImportAsset> assets) =>
        new(true, exportId, schemaVersion, stateJson, assets, null);

    public static StartImportResult Fail(string error) => new(false, null, null, null, null, error);
}

public record CompleteImportResult(bool IsSuccess, string? Error)
{
    public static CompleteImportResult Success() => new(true, null);
    public static CompleteImportResult Fail(string error) => new(false, error);
}
