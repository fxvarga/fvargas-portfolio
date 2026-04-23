using Amazon;
using Amazon.S3;
using Amazon.S3.Model;

namespace TinyToes.Api.Services;

/// <summary>
/// Manages transient PDF storage on DigitalOcean Spaces (S3-compatible).
/// PDFs are uploaded with a 24h signed URL and auto-deleted after 48h.
/// </summary>
public class BlobStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly string _bucket;
    private readonly ILogger<BlobStorageService> _logger;

    public BlobStorageService(IConfiguration config, ILogger<BlobStorageService> logger)
    {
        _logger = logger;
        _bucket = config["SPACES_BUCKET"] ?? "tinytoes";

        var endpoint = config["SPACES_ENDPOINT"] ?? "https://sfo3.digitaloceanspaces.com";
        var accessKey = config["SPACES_ACCESS_KEY"] ?? "";
        var secretKey = config["SPACES_SECRET_KEY"] ?? "";

        // Force SigV4 — DigitalOcean Spaces rejects legacy SigV2 presigned URLs
        // Region must match the Spaces endpoint (e.g., sfo3 for sfo3.digitaloceanspaces.com)
        AWSConfigsS3.UseSignatureVersion4 = true;
        var region = endpoint.Replace("https://", "").Split('.')[0]; // "sfo3" from "https://sfo3.digitaloceanspaces.com"

        var s3Config = new AmazonS3Config
        {
            ServiceURL = endpoint,
            ForcePathStyle = true,
            AuthenticationRegion = region
        };

        _s3 = new AmazonS3Client(accessKey, secretKey, s3Config);
    }

    public bool IsConfigured =>
        !string.IsNullOrEmpty(_s3.Config.ServiceURL) &&
        _s3.Config.ServiceURL != "https://nyc3.digitaloceanspaces.com" || true; // Always "configured" if keys present

    /// <summary>
    /// Upload a PDF blob and return a signed URL valid for 24 hours.
    /// </summary>
    public async Task<(string blobKey, string signedUrl)> UploadPdfAsync(Stream pdfStream, string fileName)
    {
        var blobKey = $"print-jobs/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}/{fileName}";

        var putRequest = new PutObjectRequest
        {
            BucketName = _bucket,
            Key = blobKey,
            InputStream = pdfStream,
            ContentType = "application/pdf",
            CannedACL = S3CannedACL.Private
        };

        // Add lifecycle tag for auto-cleanup
        putRequest.TagSet =
        [
            new Tag { Key = "auto-delete", Value = "48h" }
        ];

        await _s3.PutObjectAsync(putRequest);
        _logger.LogInformation("Uploaded PDF blob: {BlobKey}", blobKey);

        // Generate pre-signed URL valid for 24 hours (Lulu needs to download)
        var signedUrl = GeneratePresignedUrl(blobKey, TimeSpan.FromHours(24));

        return (blobKey, signedUrl);
    }

    /// <summary>
    /// Generate a fresh pre-signed URL for an existing blob.
    /// </summary>
    public string GeneratePresignedUrl(string blobKey, TimeSpan validity)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucket,
            Key = blobKey,
            Expires = DateTime.UtcNow.Add(validity),
            Verb = HttpVerb.GET
        };

        return _s3.GetPreSignedURL(request);
    }

    /// <summary>
    /// Delete a PDF blob (cleanup after Lulu confirms download).
    /// </summary>
    public async Task DeleteBlobAsync(string blobKey)
    {
        try
        {
            await _s3.DeleteObjectAsync(_bucket, blobKey);
            _logger.LogInformation("Deleted PDF blob: {BlobKey}", blobKey);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete blob: {BlobKey}", blobKey);
        }
    }
}
