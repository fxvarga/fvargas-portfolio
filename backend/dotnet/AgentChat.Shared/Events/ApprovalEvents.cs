using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Events;

/// <summary>
/// Emitted when a tool call requires approval
/// </summary>
public record ApprovalRequestedEvent : RunEventBase
{
    public override string EventType => "approval.requested";
    
    public required Guid ApprovalId { get; init; }
    public required Guid ToolCallId { get; init; }
    public required string ToolName { get; init; }
    public required JsonElement Args { get; init; }
    public required RiskTier RiskTier { get; init; }
    public DateTime? ExpiresAt { get; init; }
}

/// <summary>
/// Emitted when an approval request is resolved
/// </summary>
public record ApprovalResolvedEvent : RunEventBase
{
    public override string EventType => "approval.resolved";
    
    public required Guid ApprovalId { get; init; }
    public required ApprovalDecision Decision { get; init; }
    public JsonElement? EditedArgs { get; init; }
    public required Guid ResolvedBy { get; init; }
}
