namespace TinyToes.Infrastructure.Entities;

public class Session
{
    public Guid SessionId { get; set; }
    public Guid BuyerId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Buyer Buyer { get; set; } = null!;
}
