using System.Security.Claims;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Dtos;
using AgentChat.Shared.Events;
using AgentChat.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgentChat.ApiBff.Endpoints;

public static class RunEndpoints
{
    public static void MapRunEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/runs")
            .RequireAuthorization();

        group.MapGet("", ListRuns);
        group.MapGet("{runId:guid}", GetRun);
        group.MapPost("", CreateRun);
        group.MapPost("{runId:guid}/messages", SendMessage);
        group.MapGet("{runId:guid}/events", StreamEvents);
    }

    private static async Task<IResult> ListRuns(
        [FromServices] IEventStore eventStore,
        HttpContext context,
        ClaimsPrincipal user,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        var tenantId = GetTenantId(context);
        var userId = GetUserId(user);

        var runs = await eventStore.ListRunsAsync(tenantId, userId, skip, take);
        return Results.Ok(runs);
    }

    private static async Task<IResult> GetRun(
        Guid runId,
        [FromServices] IRunStateProjector projector,
        HttpContext context,
        ClaimsPrincipal user)
    {
        var state = await projector.ProjectAsync(runId);
        
        if (state.RunId == Guid.Empty)
            return Results.NotFound();

        var tenantId = GetTenantId(context);
        if (state.TenantId != tenantId)
            return Results.Forbid();

        return Results.Ok(MapToDto(state));
    }

    private static async Task<IResult> CreateRun(
        [FromBody] CreateRunRequest request,
        [FromServices] IEventStore eventStore,
        [FromServices] IMessageQueue messageQueue,
        HttpContext context,
        ClaimsPrincipal user)
    {
        var tenantId = GetTenantId(context);
        var userId = GetUserId(user);
        var runId = Guid.NewGuid();
        var correlationId = Guid.NewGuid();

        // Create run started event
        var runStarted = new RunStartedEvent
        {
            RunId = runId,
            TenantId = tenantId,
            UserId = userId,
            CorrelationId = correlationId,
            InitialPrompt = request.Message
        };

        // Create initial user message event
        var messageEvent = new MessageUserCreatedEvent
        {
            RunId = runId,
            TenantId = tenantId,
            MessageId = Guid.NewGuid(),
            Content = request.Message,
            CorrelationId = correlationId
        };

        await eventStore.AppendAsync([runStarted, messageEvent]);

        // Queue work for orchestrator
        var workItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = runId,
            TenantId = tenantId,
            CorrelationId = correlationId,
            WorkType = WorkType.OrchestrateRun,
            Payload = new OrchestrateRunPayload { UserId = userId }
        };

        await messageQueue.PublishAsync(workItem);

        return Results.Created($"/api/runs/{runId}", new { runId, correlationId });
    }

    private static async Task<IResult> SendMessage(
        Guid runId,
        [FromBody] SendMessageRequest request,
        [FromServices] IEventStore eventStore,
        [FromServices] IRunStateProjector projector,
        [FromServices] IMessageQueue messageQueue,
        HttpContext context,
        ClaimsPrincipal user)
    {
        var tenantId = GetTenantId(context);
        var state = await projector.ProjectAsync(runId);

        if (state.RunId == Guid.Empty)
            return Results.NotFound();

        if (state.TenantId != tenantId)
            return Results.Forbid();

        if (state.Status == RunStatus.Running)
            return Results.BadRequest("Cannot send message while run is in progress");

        var correlationId = Guid.NewGuid();

        var messageEvent = new MessageUserCreatedEvent
        {
            RunId = runId,
            TenantId = tenantId,
            MessageId = Guid.NewGuid(),
            Content = request.Message,
            CorrelationId = correlationId
        };

        await eventStore.AppendAsync([messageEvent]);

        // Queue continuation
        var workItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = runId,
            TenantId = tenantId,
            CorrelationId = correlationId,
            WorkType = WorkType.ContinueRun,
            Payload = new ContinueRunPayload { UserId = GetUserId(user) }
        };

        await messageQueue.PublishAsync(workItem);

        return Results.Accepted();
    }

    private static async Task StreamEvents(
        Guid runId,
        [FromServices] IEventSubscriber subscriber,
        [FromServices] IRunStateProjector projector,
        [FromQuery] long? fromSequence,
        HttpContext context)
    {
        var tenantId = GetTenantId(context);
        var state = await projector.ProjectAsync(runId);

        if (state.TenantId != tenantId)
        {
            context.Response.StatusCode = 403;
            return;
        }

        context.Response.ContentType = "text/event-stream";
        context.Response.Headers.CacheControl = "no-cache";
        context.Response.Headers.Connection = "keep-alive";

        await foreach (var evt in subscriber.SubscribeAsync(runId, context.RequestAborted))
        {
            var data = System.Text.Json.JsonSerializer.Serialize(evt);
            await context.Response.WriteAsync($"data: {data}\n\n", context.RequestAborted);
            await context.Response.Body.FlushAsync(context.RequestAborted);
        }
    }

    private static Guid GetTenantId(HttpContext context) =>
        Guid.Parse(context.Items["TenantId"]?.ToString() ?? Guid.Empty.ToString());

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

    private static RunDto MapToDto(RunState state) => new()
    {
        RunId = state.RunId,
        TenantId = state.TenantId,
        UserId = state.UserId,
        Status = state.Status,
        Messages = state.Messages.Select(m => new MessageDto
        {
            Id = m.Id,
            Role = m.Role,
            Content = m.Content,
            Timestamp = m.Timestamp
        }).ToList(),
        Steps = state.Steps.Select(s => new StepDto
        {
            Id = s.Id,
            SequenceNumber = s.SequenceNumber,
            Type = s.Type,
            Status = s.Status
        }).ToList(),
        ToolCalls = state.ToolCalls.Select(tc => new ToolCallDto
        {
            Id = tc.Id,
            StepId = tc.StepId,
            ToolName = tc.ToolName,
            Args = tc.Args,
            Result = tc.Result,
            Error = tc.Error,
            RiskTier = tc.RiskTier,
            Status = tc.Status,
            ApprovalId = tc.ApprovalId,
            StartedAt = tc.StartedAt
        }).ToList(),
        Approvals = state.Approvals.Select(a => new ApprovalDto
        {
            Id = a.Id,
            RunId = state.RunId,
            ToolCallId = a.ToolCallId,
            ToolName = a.ToolName,
            OriginalArgs = a.OriginalArgs,
            RiskTier = state.ToolCalls.FirstOrDefault(tc => tc.Id == a.ToolCallId)?.RiskTier ?? RiskTier.Low,
            Status = a.Status,
            Decision = a.Decision,
            EditedArgs = a.EditedArgs,
            ResolvedBy = a.ResolvedBy,
            ResolvedAt = a.ResolvedAt
        }).ToList(),
        HasPendingApproval = state.HasPendingApproval,
        CreatedAt = state.CreatedAt,
        UpdatedAt = state.UpdatedAt,
        LastError = state.LastError,
        TotalTokens = state.TotalTokens
    };
}

public record CreateRunRequest(string Message, Dictionary<string, object>? Metadata = null);
public record SendMessageRequest(string Message);
