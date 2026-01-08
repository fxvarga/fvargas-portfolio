using System.Security.Claims;
using AgentChat.Shared.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AgentChat.ApiBff.Hubs;

/// <summary>
/// SignalR hub for real-time run event streaming
/// </summary>
[Authorize]
public class RunEventsHub : Hub
{
    private readonly IEventSubscriber _eventSubscriber;
    private readonly IRunStateProjector _projector;
    private readonly ILogger<RunEventsHub> _logger;

    public RunEventsHub(
        IEventSubscriber eventSubscriber,
        IRunStateProjector projector,
        ILogger<RunEventsHub> logger)
    {
        _eventSubscriber = eventSubscriber;
        _projector = projector;
        _logger = logger;
    }

    public async Task JoinRun(Guid runId)
    {
        var tenantId = GetTenantId();
        var state = await _projector.ProjectAsync(runId);

        if (state.TenantId != tenantId)
        {
            _logger.LogWarning("User attempted to join run {RunId} from different tenant", runId);
            await Clients.Caller.SendAsync("Error", "Not authorized to access this run");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"run:{runId}");
        
        // Send current state
        await Clients.Caller.SendAsync("RunState", state);
        
        _logger.LogInformation("User joined run {RunId}", runId);
    }

    public async Task LeaveRun(Guid runId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"run:{runId}");
        _logger.LogInformation("User left run {RunId}", runId);
    }

    /// <summary>
    /// Subscribe to events for a run and stream them to the client
    /// </summary>
    public async IAsyncEnumerable<object> StreamEvents(
        Guid runId,
        long? fromSequence,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var tenantId = GetTenantId();
        var state = await _projector.ProjectAsync(runId);

        if (state.TenantId != tenantId)
        {
            _logger.LogWarning("User attempted to stream run {RunId} from different tenant", runId);
            yield break;
        }

        await foreach (var evt in _eventSubscriber.SubscribeAsync(runId, cancellationToken))
        {
            yield return evt;
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    private Guid GetTenantId()
    {
        var tenantClaim = Context.User?.FindFirst("tenant_id");
        return tenantClaim != null ? Guid.Parse(tenantClaim.Value) : Guid.Empty;
    }

    private Guid GetUserId()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return userId != null ? Guid.Parse(userId) : Guid.Empty;
    }
}
