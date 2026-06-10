namespace TinyToes.Infrastructure.Entities;

public class ExportManifest
{
    public Guid ExportId { get; set; }
    public int SchemaVersion { get; set; }
    public Guid OwnerUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string StateJson { get; set; } = "{}";
    public long TotalAssetBytes { get; set; }

    public ICollection<ExportManifestAsset> Assets { get; set; } = new List<ExportManifestAsset>();
}
