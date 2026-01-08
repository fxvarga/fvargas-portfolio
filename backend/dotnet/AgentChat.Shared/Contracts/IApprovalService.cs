using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Contracts;

/// <summary>
/// Service for managing tool call approvals
/// </summary>
public interface IApprovalService
{
    /// <summary>
    /// Create a new approval request
    /// </summary>
    Task<Guid> RequestApprovalAsync(
        ApprovalRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get pending approvals for a run
    /// </summary>
    Task<IReadOnlyList<PendingApproval>> GetPendingApprovalsAsync(
        Guid runId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get pending approvals for a user across all runs
    /// </summary>
    Task<IReadOnlyList<PendingApproval>> GetUserPendingApprovalsAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolve an approval request
    /// </summary>
    Task ResolveApprovalAsync(
        ApprovalResolution resolution,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if an approval is still pending
    /// </summary>
    Task<bool> IsPendingAsync(Guid approvalId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Request for approval
/// </summary>
public record ApprovalRequest
{
    public required Guid RunId { get; init; }
    public required Guid StepId { get; init; }
    public required Guid ToolCallId { get; init; }
    public required Guid TenantId { get; init; }
    public required Guid UserId { get; init; }
    public required Guid CorrelationId { get; init; }
    public required string ToolName { get; init; }
    public required JsonElement Args { get; init; }
    public required RiskTier RiskTier { get; init; }
    public required string Summary { get; init; }
    public TimeSpan? ExpiresIn { get; init; }
}

/// <summary>
/// Pending approval details
/// </summary>
public record PendingApproval
{
    public required Guid Id { get; init; }
    public required Guid RunId { get; init; }
    public required Guid StepId { get; init; }
    public required Guid ToolCallId { get; init; }
    public required string ToolName { get; init; }
    public required JsonElement Args { get; init; }
    public required RiskTier RiskTier { get; init; }
    public required string Summary { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
}

/// <summary>
/// Resolution of an approval request
/// </summary>
public record ApprovalResolution
{
    public required Guid ApprovalId { get; init; }
    public required Guid ResolvedBy { get; init; }
    public required ApprovalDecision Decision { get; init; }
    public JsonElement? EditedArgs { get; init; }
    public string? Reason { get; init; }
}
