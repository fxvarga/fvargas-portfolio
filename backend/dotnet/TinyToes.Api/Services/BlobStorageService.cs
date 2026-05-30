using Azure.Storage;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace TinyToes.Api.Services;

/// <summary>
/// Manages transient PDF storage on Azure Blob Storage.
/// PDFs are uploaded with a 24h SAS URL and can be deleted explicitly;
/// long-term cleanup is handled by an account-level lifecycle policy.
/// </summary>
public class BlobStorageService
{
    private readonly BlobContainerClient? _container;
    private readonly StorageSharedKeyCredential? _sharedKey;
    private readonly string _accountName;
    private readonly string _containerName;
    private readonly ILogger<BlobStorageService> _logger;

    public BlobStorageService(IConfiguration config, ILogger<BlobStorageService> logger)
    {
        _logger = logger;
        _containerName = config["AZURE_STORAGE_CONTAINER"] ?? "tinytoes";

        var connectionString = config["AZURE_STORAGE_CONNECTION_STRING"] ?? "";
        var accountName = config["AZURE_STORAGE_ACCOUNT_NAME"] ?? "";
        var accountKey = config["AZURE_STORAGE_ACCOUNT_KEY"] ?? "";

        if (!string.IsNullOrEmpty(connectionString))
        {
            var service = new BlobServiceClient(connectionString);
            _container = service.GetBlobContainerClient(_containerName);
            _accountName = _container.AccountName;
            _sharedKey = TryParseSharedKey(connectionString, _accountName);
        }
        else if (!string.IsNullOrEmpty(accountName) && !string.IsNullOrEmpty(accountKey))
        {
            _sharedKey = new StorageSharedKeyCredential(accountName, accountKey);
            var serviceUri = new Uri($"https://{accountName}.blob.core.windows.net");
            var service = new BlobServiceClient(serviceUri, _sharedKey);
            _container = service.GetBlobContainerClient(_containerName);
            _accountName = accountName;
        }
        else
        {
            _accountName = "";
        }
    }

    public bool IsConfigured => _container is not null && _sharedKey is not null;

    /// <summary>
    /// Upload a PDF blob and return a SAS URL valid for 24 hours.
    /// </summary>
    public async Task<(string blobKey, string signedUrl)> UploadPdfAsync(Stream pdfStream, string fileName)
    {
        if (_container is null || _sharedKey is null)
            throw new InvalidOperationException("Azure Storage is not fully configured.");

        var blobKey = $"print-jobs/{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid()}/{fileName}";
        var blob = _container.GetBlobClient(blobKey);

        var headers = new BlobHttpHeaders { ContentType = "application/pdf" };
        var metadata = new Dictionary<string, string> { ["auto_delete"] = "48h" };

        await blob.UploadAsync(pdfStream, new BlobUploadOptions
        {
            HttpHeaders = headers,
            Metadata = metadata
        });

        _logger.LogInformation("Uploaded PDF blob: {BlobKey}", blobKey);

        // Generate a SAS URL valid for 24 hours (Lulu needs to download)
        var signedUrl = GeneratePresignedUrl(blobKey, TimeSpan.FromHours(24));

        return (blobKey, signedUrl);
    }

    /// <summary>
    /// Generate a fresh read-only SAS URL for an existing blob.
    /// </summary>
    public string GeneratePresignedUrl(string blobKey, TimeSpan validity)
    {
        if (_container is null || _sharedKey is null)
            throw new InvalidOperationException("Azure Storage is not configured.");

        var blob = _container.GetBlobClient(blobKey);

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = _containerName,
            BlobName = blobKey,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
            ExpiresOn = DateTimeOffset.UtcNow.Add(validity),
            Protocol = SasProtocol.Https
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasToken = sasBuilder.ToSasQueryParameters(_sharedKey).ToString();
        return $"{blob.Uri}?{sasToken}";
    }

    /// <summary>
    /// Delete a PDF blob (cleanup after Lulu confirms download).
    /// </summary>
    public async Task DeleteBlobAsync(string blobKey)
    {
        if (_container is null)
            return;

        try
        {
            await _container.GetBlobClient(blobKey).DeleteIfExistsAsync();
            _logger.LogInformation("Deleted PDF blob: {BlobKey}", blobKey);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete blob: {BlobKey}", blobKey);
        }
    }

    private static StorageSharedKeyCredential? TryParseSharedKey(string connectionString, string accountName)
    {
        // Parse "AccountName=x;AccountKey=y;..." style connection strings.
        string? name = null;
        string? key = null;
        foreach (var part in connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var idx = part.IndexOf('=');
            if (idx <= 0) continue;
            var k = part[..idx].Trim();
            var v = part[(idx + 1)..].Trim();
            if (string.Equals(k, "AccountName", StringComparison.OrdinalIgnoreCase)) name = v;
            else if (string.Equals(k, "AccountKey", StringComparison.OrdinalIgnoreCase)) key = v;
        }

        name ??= accountName;
        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(key))
            return null;

        return new StorageSharedKeyCredential(name, key);
    }
}
