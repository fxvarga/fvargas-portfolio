using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using AgentChat.Infrastructure.Persistence;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;

namespace AgentChat.Infrastructure.Approvals;

/// <summary>
/// Implementation of IApprovalService using PostgreSQL
/// </summary>
public class ApprovalService : IApprovalService
{
    private readonly AgentChatDbContext _dbContext;

    public ApprovalService(AgentChatDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid> RequestApprovalAsync(
        ApprovalRequest request,
        CancellationToken cancellationToken = default)
    {
        var approvalId = Guid.NewGuid();
        
        var entity = new ApprovalEntity
        {
            Id = approvalId,
            RunId = request.RunId,
            StepId = request.StepId,
            ToolCallId = request.ToolCallId,
            TenantId = request.TenantId,
            UserId = request.UserId,
            ToolName = request.ToolName,
            Args = request.Args.GetRawText(),
            RiskTier = request.RiskTier.ToString(),
            Summary = request.Summary,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = request.ExpiresIn.HasValue 
                ? DateTime.UtcNow.Add(request.ExpiresIn.Value) 
                : null
        };

        _dbContext.Approvals.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        
        return approvalId;
    }

    public async Task<IReadOnlyList<PendingApproval>> GetPendingApprovalsAsync(
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        var approvals = await _dbContext.Approvals
            .Where(a => a.RunId == runId && a.Status == "Pending")
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return approvals.Select(MapToPendingApproval).ToList();
    }

    public async Task<IReadOnlyList<PendingApproval>> GetUserPendingApprovalsAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        var approvals = await _dbContext.Approvals
            .Where(a => a.TenantId == tenantId 
                && a.UserId == userId 
                && a.Status == "Pending")
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return approvals.Select(MapToPendingApproval).ToList();
    }

    public async Task ResolveApprovalAsync(
        ApprovalResolution resolution,
        CancellationToken cancellationToken = default)
    {
        var approval = await _dbContext.Approvals
            .FirstOrDefaultAsync(a => a.Id == resolution.ApprovalId, cancellationToken);

        if (approval == null)
            throw new InvalidOperationException($"Approval {resolution.ApprovalId} not found");

        if (approval.Status != "Pending")
            throw new InvalidOperationException($"Approval {resolution.ApprovalId} is not pending");

        approval.Status = "Resolved";
        approval.Decision = resolution.Decision.ToString();
        approval.ResolvedBy = resolution.ResolvedBy;
        approval.ResolvedAt = DateTime.UtcNow;
        approval.Reason = resolution.Reason;

        if (resolution.EditedArgs.HasValue)
        {
            approval.EditedArgs = resolution.EditedArgs.Value.GetRawText();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsPendingAsync(
        Guid approvalId, 
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Approvals
            .AnyAsync(a => a.Id == approvalId && a.Status == "Pending", cancellationToken);
    }

    private static PendingApproval MapToPendingApproval(ApprovalEntity entity)
    {
        return new PendingApproval
        {
            Id = entity.Id,
            RunId = entity.RunId,
            StepId = entity.StepId,
            ToolCallId = entity.ToolCallId,
            ToolName = entity.ToolName,
            Args = JsonDocument.Parse(entity.Args).RootElement,
            RiskTier = Enum.Parse<RiskTier>(entity.RiskTier),
            Summary = entity.Summary,
            CreatedAt = entity.CreatedAt,
            ExpiresAt = entity.ExpiresAt
        };
    }
}
