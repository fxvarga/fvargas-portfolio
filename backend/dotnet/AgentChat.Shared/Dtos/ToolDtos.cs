using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Dtos;

/// <summary>
/// Tool call data transfer object
/// </summary>
public record ToolCallDto
{
    public Guid Id { get; init; }
    public Guid RunId { get; init; }
    public Guid StepId { get; init; }
    public string ToolName { get; init; } = string.Empty;
    public JsonElement Args { get; init; }
    public RiskTier RiskTier { get; init; }
    public string Status { get; init; } = "pending";
    public JsonElement? Result { get; init; }
    public string? Error { get; init; }
    public double? DurationMs { get; init; }
    public Guid? ApprovalId { get; init; }
    public DateTime StartedAt { get; init; }
    public bool RequiresApproval => RiskTier >= RiskTier.Medium;
}

/// <summary>
/// Approval data transfer object
/// </summary>
public record ApprovalDto
{
    public Guid Id { get; init; }
    public Guid RunId { get; init; }
    public Guid StepId { get; init; }
    public Guid ToolCallId { get; init; }
    public string ToolName { get; init; } = string.Empty;
    public JsonElement OriginalArgs { get; init; }
    public RiskTier RiskTier { get; init; }
    public ApprovalStatus Status { get; init; }
    public ApprovalDecision? Decision { get; init; }
    public JsonElement? EditedArgs { get; init; }
    public Guid? ResolvedBy { get; init; }
    public DateTime? ResolvedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
}

/// <summary>
/// Tool result returned from tool execution
/// </summary>
public record ToolResultDto
{
    public bool Success { get; init; }
    public JsonElement? Output { get; init; }
    public string? Error { get; init; }
    public List<ArtifactDto>? Artifacts { get; init; }
}
