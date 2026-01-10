using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Dtos;
using AgentChat.Shared.Events;
using AgentChat.Shared.Models;
using AgentChat.Orchestrator.Prompts;
using Microsoft.Extensions.Options;

namespace AgentChat.Orchestrator.Workers;

/// <summary>
/// Worker that orchestrates run execution by processing work items
/// </summary>
public class OrchestratorWorker : BackgroundService
{
    private readonly IMessageQueue _messageQueue;
    private readonly IEventStore _eventStore;
    private readonly IRunStateProjector _projector;
    private readonly IToolRegistry _toolRegistry;
    private readonly OrchestratorOptions _options;
    private readonly ILogger<OrchestratorWorker> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public OrchestratorWorker(
        IMessageQueue messageQueue,
        IEventStore eventStore,
        IRunStateProjector projector,
        IToolRegistry toolRegistry,
        IOptions<OrchestratorOptions> options,
        ILogger<OrchestratorWorker> logger)
    {
        _messageQueue = messageQueue;
        _eventStore = eventStore;
        _projector = projector;
        _toolRegistry = toolRegistry;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Orchestrator worker starting");
        _logger.LogInformation("Getting tools from registry type: {Type}", _toolRegistry.GetType().FullName);
        try 
        {
            var allTools = _toolRegistry.GetAllTools();
            _logger.LogInformation("Tool registry has {Count} tools available: {ToolNames}", 
                allTools.Count, 
                string.Join(", ", allTools.Take(5).Select(t => t.Name)) + (allTools.Count > 5 ? "..." : ""));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tools from registry");
        }

        await _messageQueue.SubscribeAsync(
            QueueNames.Orchestrator,
            HandleWorkItemAsync,
            stoppingToken);
    }

    private async Task<WorkItemResult> HandleWorkItemAsync(RunWorkItem workItem, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing work item {Id} of type {Type} for run {RunId}",
            workItem.Id, workItem.WorkType, workItem.RunId);

        try
        {
            return workItem.WorkType switch
            {
                WorkType.OrchestrateRun => await HandleOrchestrateRunAsync(workItem, cancellationToken),
                WorkType.ContinueRun => await HandleContinueRunAsync(workItem, cancellationToken),
                WorkType.ProcessApproval => await HandleProcessApprovalAsync(workItem, cancellationToken),
                _ => WorkItemResult.Fail($"Unknown work type: {workItem.WorkType}")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing work item {Id}", workItem.Id);
            return WorkItemResult.Fail(ex.Message);
        }
    }

    private async Task<WorkItemResult> HandleOrchestrateRunAsync(RunWorkItem workItem, CancellationToken cancellationToken)
    {
        return await HandleOrchestrateRunAsync(workItem, allowContinueFromCompleted: false, cancellationToken);
    }

    private async Task<WorkItemResult> HandleOrchestrateRunAsync(RunWorkItem workItem, bool allowContinueFromCompleted, CancellationToken cancellationToken)
    {
        var state = await _projector.ProjectAsync(workItem.RunId, cancellationToken);
        
        // If run is failed, don't process
        if (state.Status == RunStatus.Failed)
        {
            _logger.LogWarning("Run {RunId} has failed, not processing", workItem.RunId);
            return WorkItemResult.Ok();
        }

        // If run is completed and we're not explicitly allowing continuation, skip
        if (state.Status == RunStatus.Completed && !allowContinueFromCompleted)
        {
            _logger.LogWarning("Run {RunId} is already completed", workItem.RunId);
            return WorkItemResult.Ok();
        }

        // Build messages with system prompt
        var messages = new List<ChatMessagePayload>();
        
        // Add system prompt based on configured assistant type
        var assistantType = ParseAssistantType(_options.AssistantType);
        var systemPrompt = SystemPrompts.GetSystemPrompt(
            assistantType,
            ownerName: _options.OwnerName,
            portfolioName: _options.PortfolioName);
        
        _logger.LogInformation("Using {AssistantType} assistant mode", assistantType);
        
        messages.Add(new ChatMessagePayload 
        { 
            Role = "system", 
            Content = systemPrompt
        });
        
        // Add conversation history including tool calls and results
        foreach (var msg in state.Messages)
        {
            messages.Add(new ChatMessagePayload { Role = msg.Role, Content = msg.Content });
        }
        
        // Add completed tool calls as assistant messages with tool calls + tool results
        // Group tool calls by step to reconstruct the conversation flow
        var completedToolCalls = state.ToolCalls.Where(tc => tc.Status == "completed").ToList();
        if (completedToolCalls.Count > 0)
        {
            // Create an assistant message with tool calls
            var toolCallsJson = JsonSerializer.SerializeToElement(
                completedToolCalls.Select(tc => new
                {
                    id = tc.Id.ToString(),
                    type = "function",
                    function = new
                    {
                        name = tc.ToolName,
                        arguments = tc.Args.GetRawText()
                    }
                }).ToList());
            
            messages.Add(new ChatMessagePayload 
            { 
                Role = "assistant", 
                Content = null,
                ToolCalls = toolCallsJson
            });
            
            // Add tool result messages
            foreach (var tc in completedToolCalls)
            {
                var resultContent = tc.Result.HasValue 
                    ? tc.Result.Value.GetRawText()
                    : tc.Error ?? "Tool execution completed";
                    
                messages.Add(new ChatMessagePayload
                {
                    Role = "tool",
                    Content = resultContent,
                    ToolCallId = tc.Id.ToString()
                });
            }
        }

        var stepId = Guid.NewGuid();
        
        _logger.LogInformation("Building LLM call with {MessageCount} messages, {ToolCallCount} completed tool calls",
            messages.Count, completedToolCalls.Count);
        foreach (var msg in messages.Take(10))
        {
            _logger.LogInformation("  Message: role={Role}, hasContent={HasContent}, hasToolCalls={HasToolCalls}, toolCallId={ToolCallId}",
                msg.Role, !string.IsNullOrEmpty(msg.Content), msg.ToolCalls.HasValue, msg.ToolCallId ?? "none");
        }
        
        // Emit LLM started event
        var llmStarted = new LlmStartedEvent
        {
            RunId = workItem.RunId,
            StepId = stepId,
            TenantId = workItem.TenantId,
            CorrelationId = workItem.CorrelationId,
            Model = "gpt-4o",
            MaxTokens = 4096,
            Temperature = 0.7
        };

        await _eventStore.AppendAsync([llmStarted], cancellationToken: cancellationToken);

        // Queue LLM call
        var toolsForCall = GetToolsForAssistantType(assistantType);
        _logger.LogInformation("Selected {Count} tools for {AssistantType}: {ToolNames}", 
            toolsForCall.Count, assistantType, string.Join(", ", toolsForCall));
        
        var llmWorkItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = workItem.RunId,
            TenantId = workItem.TenantId,
            CorrelationId = workItem.CorrelationId,
            WorkType = WorkType.ExecuteLlmCall,
            Payload = new ExecuteLlmCallPayload
            {
                StepId = stepId,
                Model = "gpt-4o",
                Messages = messages,
                ToolNames = toolsForCall
            }
        };

        return WorkItemResult.Ok([llmWorkItem]);
    }

    private async Task<WorkItemResult> HandleContinueRunAsync(RunWorkItem workItem, CancellationToken cancellationToken)
    {
        var state = await _projector.ProjectAsync(workItem.RunId, cancellationToken);

        // Check if there are pending tool calls
        var pendingToolCalls = state.ToolCalls.Where(tc => tc.Status == "pending").ToList();
        
        if (pendingToolCalls.Count != 0)
        {
            // Queue tool executions
            var toolWorkItems = pendingToolCalls.Select(tc => new RunWorkItem
            {
                Id = Guid.NewGuid(),
                RunId = workItem.RunId,
                TenantId = workItem.TenantId,
                CorrelationId = workItem.CorrelationId,
                WorkType = WorkType.ExecuteToolCall,
                Payload = new ExecuteToolCallPayload
                {
                    StepId = tc.StepId,
                    ToolCallId = tc.Id,
                    ToolName = tc.ToolName,
                    Args = tc.Args,
                    IdempotencyKey = tc.IdempotencyKey
                }
            }).ToList();

            return WorkItemResult.Ok(toolWorkItems);
        }

        // Check if waiting for approval
        if (state.HasPendingApproval)
        {
            _logger.LogInformation("Run {RunId} is waiting for approval", workItem.RunId);
            return WorkItemResult.Ok();
        }

        // Continue with LLM call - allow continuing from completed state (follow-up messages)
        return await HandleOrchestrateRunAsync(workItem, allowContinueFromCompleted: true, cancellationToken);
    }

    private async Task<WorkItemResult> HandleProcessApprovalAsync(RunWorkItem workItem, CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Deserialize<ProcessApprovalPayload>(
            JsonSerializer.Serialize(workItem.Payload, JsonOptions), JsonOptions);

        if (payload == null)
            return WorkItemResult.Fail("Invalid approval payload");

        var state = await _projector.ProjectAsync(workItem.RunId, cancellationToken);
        var approval = state.Approvals.FirstOrDefault(a => a.Id == payload.ApprovalId);

        if (approval == null)
            return WorkItemResult.Fail($"Approval {payload.ApprovalId} not found");

        if (payload.Decision == ApprovalDecision.Reject)
        {
            // Tool was rejected, continue without executing
            _logger.LogInformation("Tool call {ToolCallId} was rejected", approval.ToolCallId);
            
            // Continue the run
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

        // Approval granted, execute the tool
        var toolCall = state.ToolCalls.FirstOrDefault(tc => tc.Id == approval.ToolCallId);
        if (toolCall == null)
            return WorkItemResult.Fail($"Tool call {approval.ToolCallId} not found");

        var args = payload.Decision == ApprovalDecision.EditApprove && payload.EditedArgs.HasValue
            ? payload.EditedArgs.Value
            : approval.OriginalArgs;

        var toolWorkItem = new RunWorkItem
        {
            Id = Guid.NewGuid(),
            RunId = workItem.RunId,
            TenantId = workItem.TenantId,
            CorrelationId = workItem.CorrelationId,
            WorkType = WorkType.ExecuteToolCall,
            Payload = new ExecuteToolCallPayload
            {
                StepId = toolCall.StepId,
                ToolCallId = toolCall.Id,
                ToolName = toolCall.ToolName,
                Args = args,
                IdempotencyKey = toolCall.IdempotencyKey
            }
        };

        return WorkItemResult.Ok([toolWorkItem]);
    }

    /// <summary>
    /// Parse assistant type string from configuration
    /// </summary>
    private static AssistantType ParseAssistantType(string? typeString)
    {
        if (string.IsNullOrEmpty(typeString))
            return AssistantType.Finance;

        return typeString.ToLowerInvariant() switch
        {
            "finance" => AssistantType.Finance,
            "portfoliovisitor" or "portfolio_visitor" => AssistantType.PortfolioVisitor,
            "portfolioautonomous" or "portfolio_autonomous" => AssistantType.PortfolioAutonomous,
            "portfolioowner" or "portfolio_owner" => AssistantType.PortfolioOwner,
            _ => AssistantType.Finance
        };
    }

    /// <summary>
    /// Get the list of tools available for a given assistant type
    /// </summary>
    private List<string> GetToolsForAssistantType(AssistantType assistantType)
    {
        var allTools = _toolRegistry.GetAllTools();
        
        return assistantType switch
        {
            // Portfolio Visitor: Only public portfolio tools (read-only)
            AssistantType.PortfolioVisitor => allTools
                .Where(t => t.Category == "portfolio" || 
                           (t.Category == "memory" && t.Tags.Contains("visitor-allowed")))
                .Select(t => t.Name)
                .ToList(),
            
            // Portfolio Autonomous: Portfolio tools for autonomous operation
            AssistantType.PortfolioAutonomous => allTools
                .Where(t => t.Category == "portfolio" || 
                           t.Category == "memory" || 
                           t.Category == "analysis" || 
                           t.Category == "content")
                .Select(t => t.Name)
                .ToList(),
            
            // Portfolio Owner: All portfolio tools
            AssistantType.PortfolioOwner => allTools
                .Where(t => t.Category == "portfolio" || 
                           t.Category == "memory" || 
                           t.Category == "analysis" || 
                           t.Category == "content")
                .Select(t => t.Name)
                .ToList(),
            
            // Finance: All non-portfolio tools
            AssistantType.Finance => allTools
                .Where(t => t.Category != "portfolio" && 
                           !t.Category.StartsWith("portfolio"))
                .Select(t => t.Name)
                .ToList(),
            
            _ => allTools.Select(t => t.Name).ToList()
        };
    }
}
