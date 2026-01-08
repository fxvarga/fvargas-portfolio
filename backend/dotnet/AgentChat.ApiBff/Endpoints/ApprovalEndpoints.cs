using System.Security.Claims;
using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Dtos;
using AgentChat.Shared.Events;
using AgentChat.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgentChat.ApiBff.Endpoints;

public static class ApprovalEndpoints
{
    public static void MapApprovalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/approvals")
            .RequireAuthorization();

        // Note: Getting pending approvals requires knowing the run ID now
        // The frontend should get pending approvals from the run state directly
        group.MapGet("", GetPendingApprovals);
        group.MapGet("{approvalId:guid}", GetApproval);
        group.MapPost("{approvalId:guid}/approve", ApproveToolCall);
        group.MapPost("{approvalId:guid}/reject", RejectToolCall);
        group.MapPost("{approvalId:guid}/edit", EditAndApprove);
    }

    /// <summary>
    /// Get all pending approvals for the current user across runs
    /// Uses event store to find runs with pending approvals
    /// </summary>
    private static async Task<IResult> GetPendingApprovals(
        [FromServices] IEventStore eventStore,
        [FromServices] IRunStateProjector projector,
        HttpContext context,
        ClaimsPrincipal user)
    {
        var tenantId = GetTenantId(context);
        var userId = GetUserId(user);

        // Get recent runs for the user to check for pending approvals
        var runs = await eventStore.ListRunsAsync(tenantId, userId, 0, 100);
        
        var pendingApprovals = new List<ApprovalDto>();
        
        foreach (var runSummary in runs)
        {
            var state = await projector.ProjectAsync(runSummary.RunId);
            if (state.HasPendingApproval)
            {
                foreach (var approval in state.Approvals.Where(a => a.Status == ApprovalStatus.Pending))
                {
                    var toolCall = state.ToolCalls.FirstOrDefault(tc => tc.Id == approval.ToolCallId);
                    pendingApprovals.Add(new ApprovalDto
                    {
                        Id = approval.Id,
                        RunId = state.RunId,
                        StepId = approval.StepId,
                        ToolCallId = approval.ToolCallId,
                        ToolName = approval.ToolName,
                        OriginalArgs = approval.OriginalArgs,
                        RiskTier = toolCall?.RiskTier ?? RiskTier.Low,
                        Status = approval.Status
                    });
                }
            }
        }

        return Results.Ok(pendingApprovals);
    }

    private static async Task<IResult> GetApproval(
        Guid approvalId,
        [FromQuery] Guid runId,
        [FromServices] IRunStateProjector projector,
        HttpContext context)
    {
        var tenantId = GetTenantId(context);
        var state = await projector.ProjectAsync(runId);
        
        if (state.TenantId != tenantId)
            return Results.Forbid();

        var approval = state.Approvals.FirstOrDefault(a => a.Id == approvalId);
        if (approval == null)
            return Results.NotFound();

        var toolCall = state.ToolCalls.FirstOrDefault(tc => tc.Id == approval.ToolCallId);
        
        return Results.Ok(new ApprovalDto
        {
            Id = approval.Id,
            RunId = state.RunId,
            StepId = approval.StepId,
            ToolCallId = approval.ToolCallId,
            ToolName = approval.ToolName,
            OriginalArgs = approval.OriginalArgs,
            RiskTier = toolCall?.RiskTier ?? RiskTier.Low,
            Status = approval.Status,
            Decision = approval.Decision,
            EditedArgs = approval.EditedArgs,
            ResolvedBy = approval.ResolvedBy,
            ResolvedAt = approval.ResolvedAt
        });
    }

    private static async Task<IResult> ApproveToolCall(
        Guid approvalId,
        [FromBody] ApprovalActionRequest request,
        [FromServices] IRunStateProjector projector,
        [FromServices] IEventStore eventStore,
        [FromServices] IMessageQueue messageQueue,
        HttpContext context,
        ClaimsPrincipal user)
    {
        var tenantId = GetTenantId(context);
        var state = await projector.ProjectAsync(request.RunId);
        
        var approval = state.Approvals.FirstOrDefault(a => a.Id == approvalId);
        if (approval == null)
            return Results.NotFound();
        
        if (approval.Status != ApprovalStatus.Pending)
            return Results.BadRequest("Approval has already been resolved");

        var userId = GetUserId(user);

        // Emit approval resolved event
        var resolvedEvent = new ApprovalResolvedEvent
        {
            RunId = request.RunId,
            TenantId = tenantId,
            CorrelationId = Guid.NewGuid(),
            ApprovalId = approvalId,
            Decision = ApprovalDecision.Approve,
            ResolvedBy = userId
        };
        await eventStore.AppendAsync([resolvedEvent]);

        // Queue work to continue run
        var workItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = request.RunId,
            TenantId = tenantId,
            CorrelationId = Guid.NewGuid(),
            WorkType = WorkType.ProcessApproval,
            Payload = new ProcessApprovalPayload
            {
                ApprovalId = approvalId,
                Decision = ApprovalDecision.Approve
            }
        };

        await messageQueue.PublishAsync(workItem);

        return Results.Ok(new { status = "approved" });
    }

    private static async Task<IResult> RejectToolCall(
        Guid approvalId,
        [FromBody] ApprovalActionRequest request,
        [FromServices] IRunStateProjector projector,
        [FromServices] IEventStore eventStore,
        [FromServices] IMessageQueue messageQueue,
        HttpContext context,
        ClaimsPrincipal user)
    {
        var tenantId = GetTenantId(context);
        var state = await projector.ProjectAsync(request.RunId);
        
        var approval = state.Approvals.FirstOrDefault(a => a.Id == approvalId);
        if (approval == null)
            return Results.NotFound();
        
        if (approval.Status != ApprovalStatus.Pending)
            return Results.BadRequest("Approval has already been resolved");

        var userId = GetUserId(user);

        // Emit approval resolved event
        var resolvedEvent = new ApprovalResolvedEvent
        {
            RunId = request.RunId,
            TenantId = tenantId,
            CorrelationId = Guid.NewGuid(),
            ApprovalId = approvalId,
            Decision = ApprovalDecision.Reject,
            ResolvedBy = userId
        };
        await eventStore.AppendAsync([resolvedEvent]);

        // Queue work to continue run
        var workItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = request.RunId,
            TenantId = tenantId,
            CorrelationId = Guid.NewGuid(),
            WorkType = WorkType.ProcessApproval,
            Payload = new ProcessApprovalPayload
            {
                ApprovalId = approvalId,
                Decision = ApprovalDecision.Reject
            }
        };

        await messageQueue.PublishAsync(workItem);

        return Results.Ok(new { status = "rejected" });
    }

    private static async Task<IResult> EditAndApprove(
        Guid approvalId,
        [FromBody] EditApprovalRequest request,
        [FromServices] IRunStateProjector projector,
        [FromServices] IEventStore eventStore,
        [FromServices] IMessageQueue messageQueue,
        HttpContext context,
        ClaimsPrincipal user)
    {
        var tenantId = GetTenantId(context);
        var state = await projector.ProjectAsync(request.RunId);
        
        var approval = state.Approvals.FirstOrDefault(a => a.Id == approvalId);
        if (approval == null)
            return Results.NotFound();
        
        if (approval.Status != ApprovalStatus.Pending)
            return Results.BadRequest("Approval has already been resolved");

        var userId = GetUserId(user);

        // Emit approval resolved event with edited args
        var resolvedEvent = new ApprovalResolvedEvent
        {
            RunId = request.RunId,
            TenantId = tenantId,
            CorrelationId = Guid.NewGuid(),
            ApprovalId = approvalId,
            Decision = ApprovalDecision.EditApprove,
            EditedArgs = request.EditedArgs,
            ResolvedBy = userId
        };
        await eventStore.AppendAsync([resolvedEvent]);

        // Queue work to continue run with edited args
        var workItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = request.RunId,
            TenantId = tenantId,
            CorrelationId = Guid.NewGuid(),
            WorkType = WorkType.ProcessApproval,
            Payload = new ProcessApprovalPayload
            {
                ApprovalId = approvalId,
                Decision = ApprovalDecision.EditApprove,
                EditedArgs = request.EditedArgs
            }
        };

        await messageQueue.PublishAsync(workItem);

        return Results.Ok(new { status = "approved_with_edits" });
    }

    private static Guid GetTenantId(HttpContext context) =>
        Guid.Parse(context.Items["TenantId"]?.ToString() ?? Guid.Empty.ToString());

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());
}

public record ApprovalActionRequest(Guid RunId, string? Reason = null);
public record EditApprovalRequest(Guid RunId, JsonElement EditedArgs, string? Reason = null);
