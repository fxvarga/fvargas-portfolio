namespace AgentChat.Shared.Events;

/// <summary>
/// Base interface for all run events
/// </summary>
public interface IRunEvent
{
    /// <summary>Unique event identifier</summary>
    Guid Id { get; }
    
    /// <summary>Run this event belongs to</summary>
    Guid RunId { get; }
    
    /// <summary>Step this event is associated with (if applicable)</summary>
    Guid? StepId { get; }
    
    /// <summary>Event type name for serialization</summary>
    string EventType { get; }
    
    /// <summary>When the event occurred</summary>
    DateTime Timestamp { get; }
    
    /// <summary>Correlation ID for distributed tracing</summary>
    Guid CorrelationId { get; }
    
    /// <summary>ID of the event that caused this event</summary>
    Guid? CausationId { get; }
    
    /// <summary>Tenant ID for multi-tenancy</summary>
    Guid TenantId { get; }
}

/// <summary>
/// Base record implementing common event properties
/// </summary>
public abstract record RunEventBase : IRunEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid RunId { get; init; }
    public Guid? StepId { get; init; }
    public abstract string EventType { get; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public required Guid CorrelationId { get; init; }
    public Guid? CausationId { get; init; }
    public required Guid TenantId { get; init; }
}
