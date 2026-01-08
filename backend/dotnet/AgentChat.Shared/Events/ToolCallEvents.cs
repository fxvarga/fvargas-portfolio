using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Events;

/// <summary>
/// Emitted when LLM requests a tool call
/// </summary>
public record ToolCallRequestedEvent : RunEventBase
{
    public override string EventType => "tool.call.requested";
    
    public required Guid ToolCallId { get; init; }
    public required string ToolName { get; init; }
    public required JsonElement Args { get; init; }
    public required RiskTier RiskTier { get; init; }
    public required string IdempotencyKey { get; init; }
    public bool RequiresApproval { get; init; }
}

/// <summary>
/// Emitted when tool execution starts
/// </summary>
public record ToolCallStartedEvent : RunEventBase
{
    public override string EventType => "tool.call.started";
    
    public required Guid ToolCallId { get; init; }
    public required string ToolName { get; init; }
}

/// <summary>
/// Emitted when tool execution completes
/// </summary>
public record ToolCallCompletedEvent : RunEventBase
{
    public override string EventType => "tool.call.completed";
    
    public required Guid ToolCallId { get; init; }
    public required string ToolName { get; init; }
    public required bool Success { get; init; }
    public JsonElement? Output { get; init; }
    public string? Error { get; init; }
    public TimeSpan Duration { get; init; }
}
