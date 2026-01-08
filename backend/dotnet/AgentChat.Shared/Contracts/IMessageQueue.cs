using AgentChat.Shared.Dtos;

namespace AgentChat.Shared.Contracts;

/// <summary>
/// Message queue for distributing work items
/// </summary>
public interface IMessageQueue
{
    /// <summary>
    /// Publish a work item to the appropriate queue
    /// </summary>
    /// <param name="workItem">The work item to publish</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task PublishAsync(RunWorkItem workItem, CancellationToken cancellationToken = default);

    /// <summary>
    /// Publish multiple work items atomically
    /// </summary>
    Task PublishBatchAsync(IReadOnlyList<RunWorkItem> workItems, CancellationToken cancellationToken = default);

    /// <summary>
    /// Subscribe to work items for a specific queue
    /// </summary>
    /// <param name="queueName">Queue to subscribe to</param>
    /// <param name="handler">Handler for received work items</param>
    /// <param name="cancellationToken">Cancellation token</param>
    Task SubscribeAsync(
        string queueName,
        Func<RunWorkItem, CancellationToken, Task<WorkItemResult>> handler,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Acknowledge successful processing of a work item
    /// </summary>
    Task AcknowledgeAsync(string deliveryTag, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reject a work item (will be requeued or dead-lettered based on retry policy)
    /// </summary>
    Task RejectAsync(string deliveryTag, bool requeue = false, CancellationToken cancellationToken = default);
}

/// <summary>
/// Result of processing a work item
/// </summary>
public record WorkItemResult
{
    public bool Success { get; init; }
    public string? Error { get; init; }
    public IReadOnlyList<RunWorkItem>? FollowUpWorkItems { get; init; }
    
    public static WorkItemResult Ok(IReadOnlyList<RunWorkItem>? followUp = null) => 
        new() { Success = true, FollowUpWorkItems = followUp };
    
    public static WorkItemResult Fail(string error) => 
        new() { Success = false, Error = error };
}

/// <summary>
/// Queue names for routing work items
/// </summary>
public static class QueueNames
{
    public const string Orchestrator = "agent-chat.orchestrator";
    public const string ModelGateway = "agent-chat.model-gateway";
    public const string ToolExecution = "agent-chat.tools";
    public const string DeadLetter = "agent-chat.dead-letter";
}

/// <summary>
/// Pub/Sub for real-time event streaming to clients
/// </summary>
public interface IEventPublisher
{
    /// <summary>
    /// Publish an event to subscribers for a specific run
    /// </summary>
    Task PublishEventAsync(Guid runId, object evt, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Publish events to subscribers for a specific run
    /// </summary>
    Task PublishEventsAsync(Guid runId, IReadOnlyList<object> events, CancellationToken cancellationToken = default);
}

/// <summary>
/// Subscribe to real-time events for a run
/// </summary>
public interface IEventSubscriber
{
    /// <summary>
    /// Subscribe to events for a specific run
    /// </summary>
    /// <param name="runId">Run to subscribe to</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Async stream of events</returns>
    IAsyncEnumerable<object> SubscribeAsync(Guid runId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Subscribe to events for multiple runs (e.g., all runs for a user)
    /// </summary>
    IAsyncEnumerable<(Guid RunId, object Event)> SubscribeManyAsync(
        IReadOnlyList<Guid> runIds,
        CancellationToken cancellationToken = default);
}
