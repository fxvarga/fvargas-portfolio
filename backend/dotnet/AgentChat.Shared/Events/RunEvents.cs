namespace AgentChat.Shared.Events;

/// <summary>
/// Emitted when a new run is started
/// </summary>
public record RunStartedEvent : RunEventBase
{
    public override string EventType => "run.started";
    
    public required Guid UserId { get; init; }
    public string? InitialPrompt { get; init; }
    public Dictionary<string, object>? Metadata { get; init; }
}

/// <summary>
/// Emitted when a run is waiting for user input (agent has responded)
/// </summary>
public record RunWaitingInputEvent : RunEventBase
{
    public override string EventType => "run.waiting_input";
}

/// <summary>
/// Emitted when a run completes successfully
/// </summary>
public record RunCompletedEvent : RunEventBase
{
    public override string EventType => "run.completed";
    
    public TimeSpan TotalDuration { get; init; }
    public int TotalTokens { get; init; }
    public int TotalSteps { get; init; }
    public int TotalToolCalls { get; init; }
}

/// <summary>
/// Emitted when a run fails
/// </summary>
public record RunFailedEvent : RunEventBase
{
    public override string EventType => "run.failed";
    
    public required string Error { get; init; }
    public string? ErrorCode { get; init; }
    public string? StackTrace { get; init; }
}
