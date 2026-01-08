using System.Text.Json;
using AgentChat.ModelGateway.LlmClients;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Dtos;
using AgentChat.Shared.Events;
using AgentChat.Shared.Models;

namespace AgentChat.ModelGateway.Workers;

/// <summary>
/// Worker that handles LLM calls via configured LLM provider (Azure OpenAI, Ollama, etc.)
/// </summary>
public class ModelGatewayWorker : BackgroundService
{
    private readonly IMessageQueue _messageQueue;
    private readonly IEventStore _eventStore;
    private readonly IToolRegistry _toolRegistry;
    private readonly LlmClientFactory _llmClientFactory;
    private readonly ILogger<ModelGatewayWorker> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public ModelGatewayWorker(
        IMessageQueue messageQueue,
        IEventStore eventStore,
        IToolRegistry toolRegistry,
        LlmClientFactory llmClientFactory,
        ILogger<ModelGatewayWorker> logger)
    {
        _messageQueue = messageQueue;
        _eventStore = eventStore;
        _toolRegistry = toolRegistry;
        _llmClientFactory = llmClientFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Model Gateway worker starting");

        await _messageQueue.SubscribeAsync(
            QueueNames.ModelGateway,
            HandleWorkItemAsync,
            stoppingToken);
    }

    private async Task<WorkItemResult> HandleWorkItemAsync(RunWorkItem workItem, CancellationToken cancellationToken)
    {
        if (workItem.WorkType != WorkType.ExecuteLlmCall)
        {
            return WorkItemResult.Fail($"Unexpected work type: {workItem.WorkType}");
        }

        try
        {
            var payload = JsonSerializer.Deserialize<ExecuteLlmCallPayload>(
                JsonSerializer.Serialize(workItem.Payload, JsonOptions), JsonOptions);

            if (payload == null)
                return WorkItemResult.Fail("Invalid LLM call payload");

            return await ExecuteLlmCallAsync(workItem, payload, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing LLM call for work item {Id}", workItem.Id);
            
            // Emit failure event
            var failedEvent = new RunFailedEvent
            {
                RunId = workItem.RunId,
                TenantId = workItem.TenantId,
                CorrelationId = workItem.CorrelationId,
                Error = ex.Message,
                ErrorCode = "LLM_ERROR"
            };
            await _eventStore.AppendAsync([failedEvent], cancellationToken: cancellationToken);
            
            return WorkItemResult.Fail(ex.Message);
        }
    }

    private async Task<WorkItemResult> ExecuteLlmCallAsync(
        RunWorkItem workItem,
        ExecuteLlmCallPayload payload,
        CancellationToken cancellationToken)
    {
        var llmClient = _llmClientFactory.GetClient();
        _logger.LogInformation("Executing LLM call using {Provider}", llmClient.ProviderName);

        // Convert messages - support tool calls and tool results
        var messages = payload.Messages.Select(m => 
        {
            // Check if this is a tool result message
            if (!string.IsNullOrEmpty(m.ToolCallId))
            {
                return new LlmMessage 
                { 
                    Role = "tool", 
                    Content = m.Content,
                    ToolCallId = m.ToolCallId
                };
            }
            
            // Check if this is an assistant message with tool calls
            if (m.ToolCalls.HasValue && m.ToolCalls.Value.ValueKind == JsonValueKind.Array)
            {
                var toolCalls = new List<LlmToolCall>();
                foreach (var tc in m.ToolCalls.Value.EnumerateArray())
                {
                    var id = tc.GetProperty("id").GetString() ?? "";
                    var name = tc.GetProperty("function").GetProperty("name").GetString() ?? "";
                    var args = tc.GetProperty("function").GetProperty("arguments").GetString() ?? "{}";
                    toolCalls.Add(new LlmToolCall(id, name, args));
                }
                return new LlmMessage 
                { 
                    Role = m.Role, 
                    Content = m.Content,
                    ToolCalls = toolCalls
                };
            }
            
            return new LlmMessage { Role = m.Role, Content = m.Content ?? string.Empty };
        }).ToList();

        // Build tools
        var tools = new List<LlmTool>();
        _logger.LogInformation("Payload ToolNames count: {Count}", payload.ToolNames?.Count ?? 0);
        if (payload.ToolNames != null)
        {
            foreach (var toolName in payload.ToolNames)
            {
                var tool = _toolRegistry.GetTool(toolName);
                if (tool != null)
                {
                    tools.Add(new LlmTool(tool.Name, tool.Description, tool.ParametersSchema));
                }
                else
                {
                    _logger.LogWarning("Tool not found in registry: {ToolName}", toolName);
                }
            }
        }
        _logger.LogInformation("Built {Count} LlmTools to send to LLM", tools.Count);

        // Track streaming events
        var events = new List<IRunEvent>();

        // Execute LLM call with streaming
        var result = await llmClient.CompleteChatAsync(
            messages,
            tools,
            payload.Model,
            temperature: 0.7f,
            maxTokens: 4096,
            onDelta: (delta, tokenIndex) =>
            {
                var deltaEvent = new LlmDeltaEvent
                {
                    RunId = workItem.RunId,
                    StepId = payload.StepId,
                    TenantId = workItem.TenantId,
                    CorrelationId = workItem.CorrelationId,
                    Delta = delta,
                    TokenIndex = tokenIndex
                };
                events.Add(deltaEvent);
                return Task.CompletedTask;
            },
            cancellationToken);

        // Batch append delta events
        if (events.Count > 0)
        {
            await _eventStore.AppendAsync(events.ToArray(), cancellationToken: cancellationToken);
        }

        // Emit LLM completed event
        var completedEvent = new LlmCompletedEvent
        {
            RunId = workItem.RunId,
            StepId = payload.StepId,
            TenantId = workItem.TenantId,
            CorrelationId = workItem.CorrelationId,
            FullContent = result.Content,
            InputTokens = result.InputTokens,
            OutputTokens = result.OutputTokens,
            FinishReason = result.FinishReason
        };
        await _eventStore.AppendAsync([completedEvent], cancellationToken: cancellationToken);

        var followUpWorkItems = new List<RunWorkItem>();

        // Handle tool calls
        if (result.ToolCalls.Count > 0)
        {
            foreach (var toolCall in result.ToolCalls)
            {
                var tool = _toolRegistry.GetTool(toolCall.FunctionName);
                var riskTier = tool?.RiskTier ?? RiskTier.Low;
                var requiresApproval = riskTier >= RiskTier.Medium;
                var idempotencyKey = $"{workItem.RunId}:{toolCall.Id}";

                var argsElement = JsonSerializer.Deserialize<JsonElement>(toolCall.Arguments);

                var toolCallEvent = new ToolCallRequestedEvent
                {
                    RunId = workItem.RunId,
                    StepId = payload.StepId,
                    TenantId = workItem.TenantId,
                    CorrelationId = workItem.CorrelationId,
                    ToolCallId = Guid.NewGuid(),
                    ToolName = toolCall.FunctionName,
                    Args = argsElement,
                    RiskTier = riskTier,
                    IdempotencyKey = idempotencyKey,
                    RequiresApproval = requiresApproval
                };
                await _eventStore.AppendAsync([toolCallEvent], cancellationToken: cancellationToken);

                if (!requiresApproval)
                {
                    // Queue tool execution
                    followUpWorkItems.Add(new RunWorkItem
                    {
                        Id = Guid.NewGuid(),
                        RunId = workItem.RunId,
                        TenantId = workItem.TenantId,
                        CorrelationId = workItem.CorrelationId,
                        WorkType = WorkType.ExecuteToolCall,
                        Payload = new ExecuteToolCallPayload
                        {
                            StepId = payload.StepId,
                            ToolCallId = toolCallEvent.ToolCallId,
                            ToolName = toolCall.FunctionName,
                            Args = argsElement,
                            IdempotencyKey = idempotencyKey
                        }
                    });
                }
                else
                {
                    // Create approval request
                    var approvalEvent = new ApprovalRequestedEvent
                    {
                        RunId = workItem.RunId,
                        StepId = payload.StepId,
                        TenantId = workItem.TenantId,
                        CorrelationId = workItem.CorrelationId,
                        ApprovalId = Guid.NewGuid(),
                        ToolCallId = toolCallEvent.ToolCallId,
                        ToolName = toolCall.FunctionName,
                        Args = argsElement,
                        RiskTier = riskTier
                    };
                    await _eventStore.AppendAsync([approvalEvent], cancellationToken: cancellationToken);
                }
            }
        }
        else
        {
            // No tool calls - emit assistant message
            var messageEvent = new MessageAssistantCreatedEvent
            {
                RunId = workItem.RunId,
                StepId = payload.StepId,
                TenantId = workItem.TenantId,
                CorrelationId = workItem.CorrelationId,
                MessageId = Guid.NewGuid(),
                Content = result.Content
            };
            await _eventStore.AppendAsync([messageEvent], cancellationToken: cancellationToken);

            // Signal waiting for user input (don't auto-complete)
            var waitingEvent = new RunWaitingInputEvent
            {
                RunId = workItem.RunId,
                TenantId = workItem.TenantId,
                CorrelationId = workItem.CorrelationId
            };
            await _eventStore.AppendAsync([waitingEvent], cancellationToken: cancellationToken);
        }

        return WorkItemResult.Ok(followUpWorkItems.Count > 0 ? followUpWorkItems : null);
    }
}
