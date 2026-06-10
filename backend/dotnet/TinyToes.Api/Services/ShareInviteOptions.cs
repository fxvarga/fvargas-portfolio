namespace TinyToes.Api.Services;

public class ShareInviteOptions
{
    public const string SectionName = "ShareInvite";

    public int InviteTtlDays { get; set; } = 7;
    public int VerificationTokenMinutes { get; set; } = 15;
    public int ImportTokenMinutes { get; set; } = 30;
    public long MaxExportBytes { get; set; } = 25 * 1024 * 1024;
    public string AppStoreUrl { get; set; } = "https://apps.apple.com";
    public string BaseUniversalLinkUrl { get; set; } = "https://yourdomain.com/share";
    public string InviteHashKey { get; set; } = "dev-only-replace-share-invite-hash-key";
}
