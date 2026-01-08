using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Dtos;

/// <summary>
/// Work item for queue-based orchestration
/// </summary>
public record RunWorkItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid RunId { get; init; }
    public required Guid TenantId { get; init; }
    public required Guid CorrelationId { get; init; }
    public required WorkType WorkType { get; init; }
    public object? Payload { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public int RetryCount { get; init; }
    public TimeSpan? Delay { get; init; }
}

/// <summary>
/// Type of work to be performed
/// </summary>
public enum WorkType
{
    OrchestrateRun,
    ContinueRun,
    ExecuteLlmCall,
    ExecuteToolCall,
    ProcessApproval,
    TimeoutCheck,
    Cleanup
}

/// <summary>
/// Payload for orchestrating a new run
/// </summary>
public record OrchestrateRunPayload
{
    public required Guid UserId { get; init; }
}

/// <summary>
/// Payload for continuing a run
/// </summary>
public record ContinueRunPayload
{
    public required Guid UserId { get; init; }
}

/// <summary>
/// Payload for executing an LLM call
/// </summary>
public record ExecuteLlmCallPayload
{
    public required Guid StepId { get; init; }
    public required string Model { get; init; }
    public required List<ChatMessagePayload> Messages { get; init; }
    public List<string>? ToolNames { get; init; }
}

/// <summary>
/// Chat message for LLM payload
/// </summary>
public record ChatMessagePayload
{
    public required string Role { get; init; }
    public string? Content { get; init; }
    public string? ToolCallId { get; init; }
    public JsonElement? ToolCalls { get; init; }
}

/// <summary>
/// Payload for executing a tool call
/// </summary>
public record ExecuteToolCallPayload
{
    public required Guid StepId { get; init; }
    public required Guid ToolCallId { get; init; }
    public required string ToolName { get; init; }
    public required JsonElement Args { get; init; }
    public required string IdempotencyKey { get; init; }
}

/// <summary>
/// Payload for processing an approval decision
/// </summary>
public record ProcessApprovalPayload
{
    public required Guid ApprovalId { get; init; }
    public required ApprovalDecision Decision { get; init; }
    public JsonElement? EditedArgs { get; init; }
}
