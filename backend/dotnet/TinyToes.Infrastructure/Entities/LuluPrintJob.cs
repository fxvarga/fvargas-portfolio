namespace TinyToes.Infrastructure.Entities;

public class LuluPrintJob
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public long? LuluPrintJobId { get; set; }
    public string Status { get; set; } = "CREATED";
    public string? TrackingUrls { get; set; } // JSON array
    public string? RawPayload { get; set; } // last webhook payload
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastStatusAt { get; set; }

    // Navigation
    public MemoryBookOrder Order { get; set; } = null!;
}
