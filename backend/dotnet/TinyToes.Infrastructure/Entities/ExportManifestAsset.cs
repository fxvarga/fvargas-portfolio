namespace TinyToes.Infrastructure.Entities;

public class ExportManifestAsset
{
    public Guid Id { get; set; }
    public Guid ExportId { get; set; }
    public string AssetId { get; set; } = string.Empty;
    public string Kind { get; set; } = "image";
    public string CloudKitZoneName { get; set; } = string.Empty;
    public string CloudKitRecordName { get; set; } = string.Empty;
    public string CloudKitFieldName { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string Sha256 { get; set; } = string.Empty;
    public long ByteSize { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    public ExportManifest ExportManifest { get; set; } = null!;
}
