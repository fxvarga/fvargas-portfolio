using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Dtos;
using AgentChat.Shared.Events;

namespace AgentChat.Tools.Workers;

/// <summary>
/// Worker that executes tool calls
/// </summary>
public class ToolExecutionWorker : BackgroundService
{
    private readonly IMessageQueue _messageQueue;
    private readonly IEventStore _eventStore;
    private readonly IToolExecutor _toolExecutor;
    private readonly ILogger<ToolExecutionWorker> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public ToolExecutionWorker(
        IMessageQueue messageQueue,
        IEventStore eventStore,
        IToolExecutor toolExecutor,
        ILogger<ToolExecutionWorker> logger)
    {
        _messageQueue = messageQueue;
        _eventStore = eventStore;
        _toolExecutor = toolExecutor;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Tool Execution worker starting");

        await _messageQueue.SubscribeAsync(
            QueueNames.ToolExecution,
            HandleWorkItemAsync,
            stoppingToken);
    }

    private async Task<WorkItemResult> HandleWorkItemAsync(RunWorkItem workItem, CancellationToken cancellationToken)
    {
        if (workItem.WorkType != WorkType.ExecuteToolCall)
        {
            return WorkItemResult.Fail($"Unexpected work type: {workItem.WorkType}");
        }

        try
        {
            var payload = JsonSerializer.Deserialize<ExecuteToolCallPayload>(
                JsonSerializer.Serialize(workItem.Payload, JsonOptions), JsonOptions);

            if (payload == null)
                return WorkItemResult.Fail("Invalid tool call payload");

            return await ExecuteToolCallAsync(workItem, payload, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing tool call for work item {Id}", workItem.Id);
            return WorkItemResult.Fail(ex.Message);
        }
    }

    private async Task<WorkItemResult> ExecuteToolCallAsync(
        RunWorkItem workItem,
        ExecuteToolCallPayload payload,
        CancellationToken cancellationToken)
    {
        // Emit tool started event
        var startedEvent = new ToolCallStartedEvent
        {
            RunId = workItem.RunId,
            StepId = payload.StepId,
            TenantId = workItem.TenantId,
            CorrelationId = workItem.CorrelationId,
            ToolCallId = payload.ToolCallId,
            ToolName = payload.ToolName
        };
        await _eventStore.AppendAsync([startedEvent], cancellationToken: cancellationToken);

        var context = new ToolExecutionContext
        {
            RunId = workItem.RunId,
            StepId = payload.StepId,
            ToolCallId = payload.ToolCallId,
            TenantId = workItem.TenantId,
            UserId = Guid.Empty, // TODO: Get from payload
            IdempotencyKey = payload.IdempotencyKey,
            CorrelationId = workItem.CorrelationId
        };

        var result = await _toolExecutor.ExecuteAsync(
            payload.ToolName,
            payload.Args,
            context,
            cancellationToken);

        // Emit tool completed event
        var completedEvent = new ToolCallCompletedEvent
        {
            RunId = workItem.RunId,
            StepId = payload.StepId,
            TenantId = workItem.TenantId,
            CorrelationId = workItem.CorrelationId,
            ToolCallId = payload.ToolCallId,
            ToolName = payload.ToolName,
            Success = result.Success,
            Output = result.Result,
            Error = result.Error,
            Duration = result.Duration
        };
        await _eventStore.AppendAsync([completedEvent], cancellationToken: cancellationToken);

        // Emit artifacts if any
        if (result.Artifacts != null)
        {
            foreach (var artifact in result.Artifacts)
            {
                var artifactEvent = new ArtifactCreatedEvent
                {
                    RunId = workItem.RunId,
                    StepId = payload.StepId,
                    TenantId = workItem.TenantId,
                    CorrelationId = workItem.CorrelationId,
                    ArtifactId = Guid.NewGuid(),
                    Kind = artifact.Kind,
                    MimeType = artifact.MimeType
                };
                await _eventStore.AppendAsync([artifactEvent], cancellationToken: cancellationToken);
            }
        }

        // Queue continuation
        var continueWorkItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = workItem.RunId,
            TenantId = workItem.TenantId,
            CorrelationId = workItem.CorrelationId,
            WorkType = WorkType.ContinueRun,
            Payload = new ContinueRunPayload { UserId = Guid.Empty }
        };

        return WorkItemResult.Ok([continueWorkItem]);
    }
}
