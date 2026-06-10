using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Services;

public class ShareCleanupService
{
    private readonly AnalyticsService _analytics;

    public ShareCleanupService(AnalyticsService analytics)
    {
        _analytics = analytics;
    }

    public Task TriggerTransferCleanupAsync(ShareInvite invite, CancellationToken cancellationToken)
    {
        _analytics.Track("share_cleanup_completed", new Dictionary<string, string>
        {
            ["invite_id"] = invite.InviteId.ToString("N"),
            ["result"] = "queued"
        });

        return Task.CompletedTask;
    }
}
