namespace TinyToes.Infrastructure.Entities;

public class Buyer
{
    public Guid BuyerId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? StripeCustomerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<ClaimCode> ClaimCodes { get; set; } = new();
    public List<Session> Sessions { get; set; } = new();
    public List<BuyerProduct> Products { get; set; } = new();
}
