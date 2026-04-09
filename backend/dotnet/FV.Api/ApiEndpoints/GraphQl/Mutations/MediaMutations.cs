using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using HotChocolate.Authorization;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class MediaMutations
{
    private static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

    /// <summary>
    /// Upload a media file (image) to the portfolio's media library.
    /// Returns the uploaded asset metadata including the URL to reference in content.
    /// </summary>
    [Authorize]
    public async Task<MediaUploadPayload> UploadMedia(
        IFile file,
        string? altText,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext,
        [Service] IWebHostEnvironment env,
        [Service] ILogger<MediaMutations> logger)
    {
        try
        {
            if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
            {
                return new MediaUploadPayload
                {
                    Success = false,
                    ErrorMessage = "Portfolio context could not be resolved"
                };
            }

            var portfolioId = tenantContext.PortfolioId.Value;

            if (file.Length == 0)
            {
                return new MediaUploadPayload
                {
                    Success = false,
                    ErrorMessage = "No file provided or file is empty"
                };
            }

            if (file.Length > MaxFileSize)
            {
                return new MediaUploadPayload
                {
                    Success = false,
                    ErrorMessage = $"File exceeds maximum size of {MaxFileSize / 1024 / 1024} MB"
                };
            }

            var contentType = file.ContentType ?? "application/octet-stream";
            if (!AllowedImageTypes.Contains(contentType))
            {
                return new MediaUploadPayload
                {
                    Success = false,
                    ErrorMessage = $"Unsupported file type '{contentType}'. Allowed: {string.Join(", ", AllowedImageTypes)}"
                };
            }

            var fileExt = System.IO.Path.GetExtension(file.Name);
            var safeFileName = $"{Guid.NewGuid():N}{fileExt}";
            var portfolioDir = System.IO.Path.Combine(env.ContentRootPath, "wwwroot", "uploads", portfolioId.ToString());
            Directory.CreateDirectory(portfolioDir);

            var filePath = System.IO.Path.Combine(portfolioDir, safeFileName);
            await using (var readStream = file.OpenReadStream())
            await using (var writeStream = new FileStream(filePath, System.IO.FileMode.Create, System.IO.FileAccess.Write))
            {
                await readStream.CopyToAsync(writeStream);
            }

            var relativeUrl = $"/uploads/{portfolioId}/{safeFileName}";

            var mediaAsset = new MediaAsset
            {
                Id = Guid.NewGuid(),
                PortfolioId = portfolioId,
                FileName = file.Name,
                FilePath = relativeUrl,
                MimeType = contentType,
                FileSize = file.Length ?? 0,
                UploadedAt = DateTime.UtcNow,
                AltText = altText
            };

            dbContext.MediaAssets.Add(mediaAsset);
            await dbContext.SaveChangesAsync();

            logger.LogInformation(
                "Media uploaded via GraphQL: {FileName} ({MimeType}, {FileSize} bytes) for portfolio {PortfolioId}",
                mediaAsset.FileName, mediaAsset.MimeType, mediaAsset.FileSize, portfolioId);

            return new MediaUploadPayload
            {
                Success = true,
                Asset = new MediaAssetType
                {
                    Id = mediaAsset.Id,
                    FileName = mediaAsset.FileName,
                    Url = relativeUrl,
                    MimeType = mediaAsset.MimeType,
                    FileSize = mediaAsset.FileSize,
                    AltText = mediaAsset.AltText,
                    UploadedAt = mediaAsset.UploadedAt
                }
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to upload media");
            return new MediaUploadPayload
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Delete a media asset from the portfolio's media library.
    /// </summary>
    [Authorize]
    public async Task<MediaDeletePayload> DeleteMedia(
        Guid id,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext,
        [Service] IWebHostEnvironment env,
        [Service] ILogger<MediaMutations> logger)
    {
        try
        {
            if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
            {
                return new MediaDeletePayload
                {
                    Success = false,
                    ErrorMessage = "Portfolio context could not be resolved"
                };
            }

            var portfolioId = tenantContext.PortfolioId.Value;
            var asset = await dbContext.MediaAssets
                .FirstOrDefaultAsync(m => m.Id == id && m.PortfolioId == portfolioId);

            if (asset is null)
            {
                return new MediaDeletePayload
                {
                    Success = false,
                    ErrorMessage = "Media asset not found"
                };
            }

            var physicalPath = System.IO.Path.Combine(env.ContentRootPath, "wwwroot", asset.FilePath.TrimStart('/'));
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }

            dbContext.MediaAssets.Remove(asset);
            await dbContext.SaveChangesAsync();

            logger.LogInformation(
                "Media deleted via GraphQL: {FileName} (ID: {Id}) for portfolio {PortfolioId}",
                asset.FileName, id, portfolioId);

            return new MediaDeletePayload { Success = true };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete media {Id}", id);
            return new MediaDeletePayload
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
}

// GraphQL types
public class MediaAssetType
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = default!;
    public string Url { get; set; } = default!;
    public string MimeType { get; set; } = default!;
    public long FileSize { get; set; }
    public string? AltText { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class MediaUploadPayload
{
    public bool Success { get; set; }
    public MediaAssetType? Asset { get; set; }
    public string? ErrorMessage { get; set; }
}

public class MediaDeletePayload
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
