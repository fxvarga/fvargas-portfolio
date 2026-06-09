using System.Text.Json;
using TinyToes.Api.Services;

namespace TinyToes.Api.Endpoints;

public static class ShareInviteEndpoints
{
    public static void MapShareInviteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/share-invites");

        group.MapPost("", async (
            CreateShareInviteEndpointRequest request,
            ShareInviteService shareInviteService,
            ClaimService claimService,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            await shareInviteService.ExpireInvitesAsync(cancellationToken);

            var token = context.Request.Cookies["tinytoes_session"];
            if (string.IsNullOrEmpty(token))
            {
                return Results.Unauthorized();
            }

            var session = await claimService.ValidateSessionAsync(token);
            if (session is null)
            {
                return Results.Unauthorized();
            }

            if (string.IsNullOrWhiteSpace(request.RecipientEmail))
            {
                return Results.BadRequest(new { error = "recipient_email_required" });
            }

            var manifest = new CreateExportManifestRequest(
                request.ExportManifest.SchemaVersion,
                request.ExportManifest.StateJson,
                request.ExportManifest.Assets.Select(a => new CreateExportAssetRequest(
                    a.AssetId,
                    a.Kind,
                    a.CloudKitZoneName,
                    a.CloudKitRecordName,
                    a.CloudKitFieldName,
                    a.FileName,
                    a.ContentType,
                    a.Width,
                    a.Height,
                    a.Sha256,
                    a.ByteSize)).ToList());

            var result = await shareInviteService.CreateInviteAsync(session.BuyerId, request.RecipientEmail, manifest, cancellationToken);

            if (!result.IsSuccess || result.InviteId is null || result.ExpiresAt is null)
            {
                return Results.BadRequest(new { error = result.Error ?? "create_failed" });
            }

            return Results.Ok(new
            {
                inviteId = result.InviteId,
                status = "pending",
                expiresAt = result.ExpiresAt
            });
        });

        group.MapPost("/lookup", async (
            LookupShareInviteRequest request,
            ShareInviteService shareInviteService,
            CancellationToken cancellationToken) =>
        {
            await shareInviteService.ExpireInvitesAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return Results.BadRequest(new { status = "invalid_or_expired" });
            }

            var result = await shareInviteService.LookupInviteAsync(request.Code, cancellationToken);
            if (!result.IsValid)
            {
                if (result.IsExpired)
                {
                    return Results.Ok(new { status = "expired" });
                }

                if (result.IsConsumed)
                {
                    return Results.Ok(new { status = "already_used" });
                }

                return Results.BadRequest(new { status = "invalid_or_expired" });
            }

            return Results.Ok(new
            {
                inviteId = result.InviteId,
                status = "pending",
                requiresEmailVerification = true,
                maskedRecipientEmail = result.MaskedRecipientEmail,
                expiresAt = result.ExpiresAt
            });
        }).RequireRateLimiting("share-lookup");

        group.MapPost("/request-verification", async (
            RequestShareVerificationRequest request,
            ShareInviteService shareInviteService,
            CancellationToken cancellationToken) =>
        {
            await shareInviteService.ExpireInvitesAsync(cancellationToken);

            if (request.InviteId != Guid.Empty && !string.IsNullOrWhiteSpace(request.Email))
            {
                await shareInviteService.RequestVerificationAsync(request.InviteId, request.Email, cancellationToken);
            }

            return Results.Ok(new { status = "verification_sent_if_email_matches" });
        }).RequireRateLimiting("share-verification");

        group.MapPost("/verify", async (
            VerifyShareTokenRequest request,
            ShareInviteService shareInviteService,
            CancellationToken cancellationToken) =>
        {
            await shareInviteService.ExpireInvitesAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return Results.BadRequest(new { error = "invalid_or_expired_token" });
            }

            var result = await shareInviteService.VerifyAsync(request.Token, cancellationToken);
            if (!result.IsSuccess || result.InviteId is null || result.ImportToken is null)
            {
                return Results.BadRequest(new { error = result.Error ?? "invalid_or_expired_token" });
            }

            return Results.Ok(new
            {
                inviteId = result.InviteId,
                importToken = result.ImportToken,
                status = "verified"
            });
        });

        group.MapPost("/start-import", async (
            StartShareImportRequest request,
            ShareInviteService shareInviteService,
            ClaimService claimService,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            await shareInviteService.ExpireInvitesAsync(cancellationToken);

            var token = context.Request.Cookies["tinytoes_session"];
            if (string.IsNullOrEmpty(token))
            {
                return Results.Unauthorized();
            }

            var session = await claimService.ValidateSessionAsync(token);
            if (session is null)
            {
                return Results.Unauthorized();
            }

            var result = await shareInviteService.StartImportAsync(request.InviteId, session.BuyerId, request.ImportToken, cancellationToken);
            if (!result.IsSuccess || result.ExportId is null || result.SchemaVersion is null || result.StateJson is null || result.Assets is null)
            {
                return Results.BadRequest(new { error = result.Error ?? "start_import_failed" });
            }

            return Results.Ok(new
            {
                exportId = result.ExportId,
                schemaVersion = result.SchemaVersion,
                stateJson = JsonSerializer.Deserialize<JsonElement>(result.StateJson),
                assets = result.Assets
            });
        });

        group.MapPost("/complete-import", async (
            CompleteShareImportRequest request,
            ShareInviteService shareInviteService,
            ClaimService claimService,
            HttpContext context,
            CancellationToken cancellationToken) =>
        {
            await shareInviteService.ExpireInvitesAsync(cancellationToken);

            var token = context.Request.Cookies["tinytoes_session"];
            if (string.IsNullOrEmpty(token))
            {
                return Results.Unauthorized();
            }

            var session = await claimService.ValidateSessionAsync(token);
            if (session is null)
            {
                return Results.Unauthorized();
            }

            var result = await shareInviteService.CompleteImportAsync(request.InviteId, session.BuyerId, request.ImportToken, request.Result, cancellationToken);
            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { error = result.Error ?? "complete_import_failed" });
            }

            return Results.Ok(new { status = "consumed" });
        });
    }
}

public record CreateShareInviteEndpointRequest(string RecipientEmail, CreateShareExportManifestRequest ExportManifest);
public record CreateShareExportManifestRequest(int SchemaVersion, JsonElement StateJson, List<CreateShareExportAssetRequest> Assets);
public record CreateShareExportAssetRequest(
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
public record LookupShareInviteRequest(string Code);
public record RequestShareVerificationRequest(Guid InviteId, string Email);
public record VerifyShareTokenRequest(string Token);
public record StartShareImportRequest(Guid InviteId, string ImportToken);
public record CompleteShareImportRequest(Guid InviteId, string ImportToken, string Result);
