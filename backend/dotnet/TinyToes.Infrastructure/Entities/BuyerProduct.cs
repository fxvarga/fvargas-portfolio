namespace TinyToes.Infrastructure.Entities;

public class BuyerProduct
{
    public Guid BuyerProductId { get; set; }
    public Guid BuyerId { get; set; }
    public string ProductSlug { get; set; } = string.Empty;
    public Guid? ClaimCodeId { get; set; }
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    /// <summary>How the entitlement was granted: "claim", "apple", or null (legacy).</summary>
    public string? Source { get; set; }
    /// <summary>Apple original transaction ID (set when Source == "apple").</summary>
    public string? AppleTransactionId { get; set; }

    public Buyer Buyer { get; set; } = null!;
    public ClaimCode? ClaimCode { get; set; }
}
