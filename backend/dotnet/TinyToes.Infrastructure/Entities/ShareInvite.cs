namespace TinyToes.Infrastructure.Entities;

public class ShareInvite
{
    public Guid InviteId { get; set; }
    public Guid OwnerUserId { get; set; }
    public string RecipientEmailNormalized { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public Guid ExportId { get; set; }
    public ShareInviteStatus Status { get; set; } = ShareInviteStatus.Pending;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? ClaimedByUserId { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public DateTime? ImportStartedAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public DateTime? VerificationTokenExpiresAt { get; set; }
    public string? VerificationTokenHash { get; set; }
    public DateTime? VerificationTokenUsedAt { get; set; }
    public DateTime? ImportTokenExpiresAt { get; set; }
    public string? ImportTokenHash { get; set; }
    public DateTime? ImportTokenUsedAt { get; set; }
    public string? LastError { get; set; }

    public ExportManifest ExportManifest { get; set; } = null!;
}

public enum ShareInviteStatus
{
    Pending = 0,
    EmailVerificationSent = 1,
    Verified = 2,
    Importing = 3,
    Consumed = 4,
    Expired = 5,
    Revoked = 6,
    Failed = 7
}
