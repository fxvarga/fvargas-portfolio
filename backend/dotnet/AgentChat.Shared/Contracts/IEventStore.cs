using AgentChat.Shared.Events;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Contracts;

/// <summary>
/// Append-only event store for run events
/// </summary>
public interface IEventStore
{
    /// <summary>
    /// Append one or more events to the store
    /// </summary>
    /// <param name="events">Events to append</param>
    /// <param name="expectedSequence">Optional optimistic concurrency check</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The sequence numbers assigned to the events</returns>
    Task<long[]> AppendAsync(
        IReadOnlyList<IRunEvent> events,
        long? expectedSequence = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Load all events for a specific run
    /// </summary>
    /// <param name="runId">The run identifier</param>
    /// <param name="fromSequence">Start from this sequence number (exclusive)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Stream of events ordered by sequence</returns>
    IAsyncEnumerable<StoredEvent> LoadEventsAsync(
        Guid runId,
        long fromSequence = 0,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Load events for a specific run up to a maximum count
    /// </summary>
    /// <param name="runId">The run identifier</param>
    /// <param name="fromSequence">Start from this sequence number (exclusive)</param>
    /// <param name="maxCount">Maximum number of events to return</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of stored events</returns>
    Task<IReadOnlyList<StoredEvent>> LoadEventsBatchAsync(
        Guid runId,
        long fromSequence = 0,
        int maxCount = 1000,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the current sequence number for a run
    /// </summary>
    Task<long> GetCurrentSequenceAsync(Guid runId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a run exists
    /// </summary>
    Task<bool> RunExistsAsync(Guid runId, CancellationToken cancellationToken = default);

    /// <summary>
    /// List runs for a tenant with pagination
    /// </summary>
    Task<IReadOnlyList<RunSummary>> ListRunsAsync(
        Guid tenantId,
        Guid? userId = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// A stored event with sequence number
/// </summary>
public record StoredEvent
{
    public required long Sequence { get; init; }
    public required IRunEvent Event { get; init; }
    public required string EventType { get; init; }
    public required DateTime StoredAt { get; init; }
}

/// <summary>
/// Summary of a run for listing
/// </summary>
public record RunSummary
{
    public Guid RunId { get; init; }
    public Guid TenantId { get; init; }
    public Guid UserId { get; init; }
    public RunStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public int MessageCount { get; init; }
    public int StepCount { get; init; }
    public string? FirstUserMessage { get; init; }
}

/// <summary>
/// Service to reconstruct run state from events
/// </summary>
public interface IRunStateProjector
{
    /// <summary>
    /// Reconstruct run state from stored events
    /// </summary>
    Task<RunState> ProjectAsync(Guid runId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Apply a single event to an existing state
    /// </summary>
    RunState Apply(RunState state, IRunEvent evt);
}
