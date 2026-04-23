namespace TinyToes.Infrastructure.Entities;

public class PdfUpload
{
    public Guid Id { get; set; }
    public string BlobKey { get; set; } = string.Empty;
    public string SignedUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public Guid? OrderId { get; set; }
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public MemoryBookOrder? Order { get; set; }
}
