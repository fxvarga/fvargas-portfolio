namespace TinyToes.Infrastructure.Entities;

public class OrderStatusToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public MemoryBookOrder Order { get; set; } = null!;
}
