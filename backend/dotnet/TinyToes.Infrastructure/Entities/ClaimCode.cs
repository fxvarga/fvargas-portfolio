namespace TinyToes.Infrastructure.Entities;

public class ClaimCode
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public ClaimCodeStatus Status { get; set; } = ClaimCodeStatus.Unclaimed;
    public string? BuyerEmail { get; set; }
    public Guid? BuyerId { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Buyer? Buyer { get; set; }
}

public enum ClaimCodeStatus
{
    Unclaimed,
    Claimed
}
