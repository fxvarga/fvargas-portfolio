namespace TinyToes.Infrastructure.Entities;

public class BuyerProduct
{
    public Guid BuyerProductId { get; set; }
    public Guid BuyerId { get; set; }
    public string ProductSlug { get; set; } = string.Empty;
    public Guid? ClaimCodeId { get; set; }
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;

    public Buyer Buyer { get; set; } = null!;
    public ClaimCode? ClaimCode { get; set; }
}
