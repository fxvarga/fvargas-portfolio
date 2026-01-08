namespace AgentChat.Shared.Events;

/// <summary>
/// Emitted when LLM inference starts
/// </summary>
public record LlmStartedEvent : RunEventBase
{
    public override string EventType => "llm.started";
    
    public required string Model { get; init; }
    public int MaxTokens { get; init; }
    public double Temperature { get; init; }
}

/// <summary>
/// Emitted for each token delta during streaming
/// </summary>
public record LlmDeltaEvent : RunEventBase
{
    public override string EventType => "llm.delta";
    
    public required string Delta { get; init; }
    public int TokenIndex { get; init; }
    public string? FinishReason { get; init; }
}

/// <summary>
/// Emitted when LLM inference completes
/// </summary>
public record LlmCompletedEvent : RunEventBase
{
    public override string EventType => "llm.completed";
    
    public required string FullContent { get; init; }
    public int InputTokens { get; init; }
    public int OutputTokens { get; init; }
    public string? FinishReason { get; init; }
    public TimeSpan Duration { get; init; }
}
