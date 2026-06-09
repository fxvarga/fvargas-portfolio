namespace TinyToes.Api.Services;

public class ShareInviteExpirationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ShareInviteExpirationService> _logger;

    public ShareInviteExpirationService(IServiceProvider serviceProvider, ILogger<ShareInviteExpirationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunExpirationAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to expire share invites.");
            }

            try
            {
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task RunExpirationAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var shareInviteService = scope.ServiceProvider.GetRequiredService<ShareInviteService>();
        await shareInviteService.ExpireInvitesAsync(cancellationToken);
    }
}
