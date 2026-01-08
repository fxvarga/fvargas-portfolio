using AgentChat.Shared.Models;

namespace AgentChat.Shared.Dtos;

/// <summary>
/// Run data transfer object
/// </summary>
public record RunDto
{
    public Guid RunId { get; init; }
    public Guid TenantId { get; init; }
    public Guid UserId { get; init; }
    public RunStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public List<MessageDto> Messages { get; init; } = new();
    public List<StepDto> Steps { get; init; } = new();
    public List<ToolCallDto> ToolCalls { get; init; } = new();
    public List<ApprovalDto> Approvals { get; init; } = new();
    public bool HasPendingApproval { get; init; }
    public string? LastError { get; init; }
    public int TotalTokens { get; init; }
}

/// <summary>
/// Step data transfer object
/// </summary>
public record StepDto
{
    public Guid Id { get; init; }
    public Guid RunId { get; init; }
    public int SequenceNumber { get; init; }
    public StepType Type { get; init; }
    public StepStatus Status { get; init; }
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public int TokenCount { get; init; }
    public int ToolCallCount { get; init; }
}

/// <summary>
/// Message data transfer object
/// </summary>
public record MessageDto
{
    public Guid Id { get; init; }
    public Guid RunId { get; init; }
    public string Role { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public List<CitationDto>? Citations { get; init; }
    public DateTime Timestamp { get; init; }
}
