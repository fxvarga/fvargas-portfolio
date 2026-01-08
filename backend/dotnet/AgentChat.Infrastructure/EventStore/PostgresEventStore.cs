using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AgentChat.Infrastructure.Persistence;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Events;
using AgentChat.Shared.Models;

namespace AgentChat.Infrastructure.EventStore;

/// <summary>
/// PostgreSQL-based event store implementation
/// </summary>
public class PostgresEventStore : IEventStore
{
    private readonly AgentChatDbContext _dbContext;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<PostgresEventStore> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public PostgresEventStore(
        AgentChatDbContext dbContext,
        IEventPublisher eventPublisher,
        ILogger<PostgresEventStore> logger)
    {
        _dbContext = dbContext;
        _eventPublisher = eventPublisher;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<long[]> AppendAsync(
        IReadOnlyList<IRunEvent> events,
        long? expectedSequence = null,
        CancellationToken cancellationToken = default)
    {
        if (events.Count == 0)
            return Array.Empty<long>();

        var runId = events[0].RunId;
        
        // Optimistic concurrency check
        if (expectedSequence.HasValue)
        {
            var currentSequence = await GetCurrentSequenceAsync(runId, cancellationToken);
            if (currentSequence != expectedSequence.Value)
            {
                throw new ConcurrencyException(
                    $"Expected sequence {expectedSequence.Value} but found {currentSequence}");
            }
        }

        var entities = events.Select(evt => new EventEntity
        {
            Id = evt.Id,
            RunId = evt.RunId,
            StepId = evt.StepId,
            EventType = evt.EventType,
            Data = JsonSerializer.Serialize(evt, evt.GetType(), _jsonOptions),
            CorrelationId = evt.CorrelationId,
            CausationId = evt.CausationId,
            TenantId = evt.TenantId,
            Timestamp = evt.Timestamp,
            StoredAt = DateTime.UtcNow
        }).ToList();

        await _dbContext.Events.AddRangeAsync(entities, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var sequences = entities.Select(e => e.Sequence).ToArray();

        // Publish events to Redis for real-time streaming
        try
        {
            await _eventPublisher.PublishEventsAsync(runId, events.Cast<object>().ToList(), cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to publish events to Redis for run {RunId}", runId);
            // Don't fail the append - events are stored, clients can catch up
        }

        _logger.LogDebug("Appended {Count} events for run {RunId}, sequences {Sequences}",
            events.Count, runId, string.Join(",", sequences));

        return sequences;
    }

    public async IAsyncEnumerable<StoredEvent> LoadEventsAsync(
        Guid runId,
        long fromSequence = 0,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Events
            .AsNoTracking()
            .Where(e => e.RunId == runId && e.Sequence > fromSequence)
            .OrderBy(e => e.Sequence)
            .AsAsyncEnumerable();

        await foreach (var entity in query.WithCancellation(cancellationToken))
        {
            var evt = DeserializeEvent(entity);
            if (evt != null)
            {
                yield return new StoredEvent
                {
                    Sequence = entity.Sequence,
                    Event = evt,
                    EventType = entity.EventType,
                    StoredAt = entity.StoredAt
                };
            }
        }
    }

    public async Task<IReadOnlyList<StoredEvent>> LoadEventsBatchAsync(
        Guid runId,
        long fromSequence = 0,
        int maxCount = 1000,
        CancellationToken cancellationToken = default)
    {
        var entities = await _dbContext.Events
            .AsNoTracking()
            .Where(e => e.RunId == runId && e.Sequence > fromSequence)
            .OrderBy(e => e.Sequence)
            .Take(maxCount)
            .ToListAsync(cancellationToken);

        return entities
            .Select(entity =>
            {
                var evt = DeserializeEvent(entity);
                return evt == null ? null : new StoredEvent
                {
                    Sequence = entity.Sequence,
                    Event = evt,
                    EventType = entity.EventType,
                    StoredAt = entity.StoredAt
                };
            })
            .Where(e => e != null)
            .Cast<StoredEvent>()
            .ToList();
    }

    public async Task<long> GetCurrentSequenceAsync(Guid runId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Events
            .Where(e => e.RunId == runId)
            .MaxAsync(e => (long?)e.Sequence, cancellationToken) ?? 0;
    }

    public async Task<bool> RunExistsAsync(Guid runId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Events
            .AnyAsync(e => e.RunId == runId, cancellationToken);
    }

    public async Task<IReadOnlyList<RunSummary>> ListRunsAsync(
        Guid tenantId,
        Guid? userId = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        // Query runs directly from the events table using aggregation
        // This avoids the need for a separate projection table
        var userFilter = userId.HasValue ? "AND e.tenant_id = @userId" : "";
        
        var sql = $@"
            WITH run_info AS (
                SELECT 
                    e.run_id,
                    e.tenant_id,
                    MIN(e.timestamp) as created_at,
                    MAX(CASE WHEN e.event_type IN ('run.completed', 'run.failed') THEN e.timestamp END) as completed_at,
                    COUNT(CASE WHEN e.event_type = 'message.user.created' THEN 1 END) as message_count,
                    COUNT(CASE WHEN e.event_type = 'tool.call.completed' THEN 1 END) as step_count,
                    COALESCE(
                        MAX(CASE WHEN e.event_type = 'run.started' THEN e.data->>'initialPrompt' END),
                        (SELECT e2.data->>'content' FROM events e2 WHERE e2.run_id = e.run_id AND e2.event_type = 'message.user.created' ORDER BY e2.timestamp ASC LIMIT 1)
                    ) as first_user_message,
                    MAX(CASE 
                        WHEN e.event_type = 'run.failed' THEN 'Failed'
                        WHEN e.event_type = 'run.completed' THEN 'Completed'
                        WHEN e.event_type = 'approval.requested' THEN 'WaitingForApproval'
                        ELSE NULL 
                    END) as status_hint,
                    (SELECT data->>'userId' FROM events e2 WHERE e2.run_id = e.run_id AND e2.event_type = 'run.started' LIMIT 1) as user_id
                FROM events e
                WHERE e.tenant_id = @tenantId
                GROUP BY e.run_id, e.tenant_id
            )
            SELECT 
                run_id as RunId,
                tenant_id as TenantId,
                user_id as UserId,
                COALESCE(status_hint, 'Running') as Status,
                created_at as CreatedAt,
                completed_at as CompletedAt,
                message_count as MessageCount,
                step_count as StepCount,
                first_user_message as FirstUserMessage
            FROM run_info
            ORDER BY created_at DESC
            OFFSET @skip LIMIT @take";

        var connection = _dbContext.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = sql;
            
            var tenantParam = command.CreateParameter();
            tenantParam.ParameterName = "@tenantId";
            tenantParam.Value = tenantId;
            command.Parameters.Add(tenantParam);

            var skipParam = command.CreateParameter();
            skipParam.ParameterName = "@skip";
            skipParam.Value = skip;
            command.Parameters.Add(skipParam);

            var takeParam = command.CreateParameter();
            takeParam.ParameterName = "@take";
            takeParam.Value = take;
            command.Parameters.Add(takeParam);

            var results = new List<RunSummary>();
            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            
            while (await reader.ReadAsync(cancellationToken))
            {
                var userIdStr = reader.IsDBNull(reader.GetOrdinal("UserId")) 
                    ? null 
                    : reader.GetString(reader.GetOrdinal("UserId"));
                
                results.Add(new RunSummary
                {
                    RunId = reader.GetGuid(reader.GetOrdinal("RunId")),
                    TenantId = reader.GetGuid(reader.GetOrdinal("TenantId")),
                    UserId = string.IsNullOrEmpty(userIdStr) ? Guid.Empty : Guid.Parse(userIdStr),
                    Status = Enum.TryParse<RunStatus>(reader.GetString(reader.GetOrdinal("Status")), out var status) 
                        ? status 
                        : RunStatus.Running,
                    CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                    CompletedAt = reader.IsDBNull(reader.GetOrdinal("CompletedAt")) 
                        ? null 
                        : reader.GetDateTime(reader.GetOrdinal("CompletedAt")),
                    MessageCount = (int)reader.GetInt64(reader.GetOrdinal("MessageCount")),
                    StepCount = (int)reader.GetInt64(reader.GetOrdinal("StepCount")),
                    FirstUserMessage = reader.IsDBNull(reader.GetOrdinal("FirstUserMessage")) 
                        ? null 
                        : reader.GetString(reader.GetOrdinal("FirstUserMessage"))
                });
            }

            return results;
        }
        finally
        {
            // Don't close the connection - EF Core manages it
        }
    }

    private IRunEvent? DeserializeEvent(EventEntity entity)
    {
        try
        {
            var eventType = EventTypeRegistry.GetType(entity.EventType);
            if (eventType == null)
            {
                _logger.LogWarning("Unknown event type: {EventType}", entity.EventType);
                return null;
            }

            return JsonSerializer.Deserialize(entity.Data, eventType, _jsonOptions) as IRunEvent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deserialize event {Id} of type {EventType}",
                entity.Id, entity.EventType);
            return null;
        }
    }
}

/// <summary>
/// Registry for event type resolution
/// </summary>
public static class EventTypeRegistry
{
    private static readonly Dictionary<string, Type> _types = new();

    static EventTypeRegistry()
    {
        // Register all event types
        RegisterEventsFromAssembly();
    }

    private static void RegisterEventsFromAssembly()
    {
        var assembly = typeof(IRunEvent).Assembly;
        var eventTypes = assembly.GetTypes()
            .Where(t => !t.IsAbstract && t.IsAssignableTo(typeof(IRunEvent)) && !t.IsInterface);

        foreach (var type in eventTypes)
        {
            try
            {
                // Create a temporary instance to get the EventType value
                // We use RuntimeHelpers to create an uninitialized instance
                var instance = System.Runtime.CompilerServices.RuntimeHelpers.GetUninitializedObject(type);
                if (instance is IRunEvent runEvent)
                {
                    var eventTypeName = runEvent.EventType;
                    if (!string.IsNullOrEmpty(eventTypeName))
                    {
                        _types[eventTypeName] = type;
                    }
                }
            }
            catch
            {
                // Fallback to type name if we can't create an instance
                _types[type.Name] = type;
            }
        }
    }

    public static Type? GetType(string eventTypeName) =>
        _types.GetValueOrDefault(eventTypeName);

    public static void Register<T>() where T : IRunEvent, new()
    {
        var instance = new T();
        _types[instance.EventType] = typeof(T);
    }

    public static IReadOnlyDictionary<string, Type> GetAllRegisteredTypes() => _types;
}

/// <summary>
/// Exception thrown when optimistic concurrency check fails
/// </summary>
public class ConcurrencyException : Exception
{
    public ConcurrencyException(string message) : base(message) { }
}
