using System.Text.Json;

namespace AgentChat.Shared.Models;

/// <summary>
/// Reconstructed state of a run from events
/// </summary>
public record RunState
{
    public Guid RunId { get; init; }
    public Guid TenantId { get; init; }
    public Guid UserId { get; init; }
    public RunStatus Status { get; init; } = RunStatus.Pending;
    
    public List<MessageState> Messages { get; init; } = new();
    public List<StepState> Steps { get; init; } = new();
    public List<ToolCallState> ToolCalls { get; init; } = new();
    public List<ApprovalState> Approvals { get; init; } = new();
    public List<ArtifactState> Artifacts { get; init; } = new();
    
    public Guid? CurrentStepId { get; init; }
    public bool HasPendingApproval { get; init; }
    public string? LastError { get; init; }
    public string StreamingContent { get; init; } = string.Empty;
    
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public int TotalTokens { get; init; }
    
    public long LastEventSequence { get; init; }
}

public record MessageState
{
    public Guid Id { get; init; }
    public string Role { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public List<CitationState> Citations { get; init; } = new();
    public DateTime Timestamp { get; init; }
}

public record StepState
{
    public Guid Id { get; init; }
    public int SequenceNumber { get; init; }
    public StepType Type { get; init; }
    public StepStatus Status { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public record ToolCallState
{
    public Guid Id { get; init; }
    public Guid StepId { get; init; }
    public string ToolName { get; init; } = string.Empty;
    public JsonElement Args { get; init; }
    public RiskTier RiskTier { get; init; }
    public string Status { get; init; } = "pending";
    public JsonElement? Result { get; init; }
    public string? Error { get; init; }
    public TimeSpan? Duration { get; init; }
    public Guid? ApprovalId { get; init; }
    public string IdempotencyKey { get; init; } = string.Empty;
    public DateTime StartedAt { get; init; }
}

public record ApprovalState
{
    public Guid Id { get; init; }
    public Guid StepId { get; init; }
    public Guid ToolCallId { get; init; }
    public string ToolName { get; init; } = string.Empty;
    public JsonElement OriginalArgs { get; init; }
    public ApprovalStatus Status { get; init; }
    public ApprovalDecision? Decision { get; init; }
    public JsonElement? EditedArgs { get; init; }
    public Guid? ResolvedBy { get; init; }
    public DateTime? ResolvedAt { get; init; }
}

public record ArtifactState
{
    public Guid Id { get; init; }
    public Guid? StepId { get; init; }
    public string Kind { get; init; } = string.Empty;
    public string? MimeType { get; init; }
    public JsonElement? Content { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record CitationState
{
    public string SourceId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Uri { get; init; } = string.Empty;
    public string ChunkText { get; init; } = string.Empty;
    public double Score { get; init; }
}
