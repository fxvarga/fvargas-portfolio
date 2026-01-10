using System.Text.Json;
using AgentChat.PortfolioAgent.Models;
using AgentChat.PortfolioAgent.Security;
using AgentChat.PortfolioAgent.Services;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using Microsoft.Extensions.Logging;

namespace AgentChat.PortfolioAgent.Tools;

/// <summary>
/// Remember a fact or insight
/// </summary>
public class RememberFactTool : ITool
{
    private readonly IAgentMemoryService _memoryService;
    private readonly ILogger<RememberFactTool> _logger;

    public RememberFactTool(IAgentMemoryService memoryService, ILogger<RememberFactTool> logger)
    {
        _memoryService = memoryService;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_remember_fact",
        Description = "Store a fact, insight, or learning in the agent's memory. Use this to remember important information for future reference.",
        Category = "memory",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The fact or insight to remember"
                },
                "type": {
                    "type": "string",
                    "enum": ["portfolio_fact", "visitor_insight", "decision_log", "learning", "visitor_suggestion", "content_analysis"],
                    "description": "The type of memory"
                },
                "classification": {
                    "type": "string",
                    "enum": ["public", "private"],
                    "description": "Whether this memory is public (visible to visitors) or private (owner only)",
                    "default": "private"
                },
                "source": {
                    "type": "string",
                    "description": "Where this information came from (e.g., 'visitor conversation', 'content analysis')"
                }
            },
            "required": ["content", "type"]
        }
        """).RootElement,
        Tags = ["memory", "write", "autonomous-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var content = args.GetProperty("content").GetString();
            var typeStr = args.GetProperty("type").GetString();
            
            if (string.IsNullOrEmpty(content) || string.IsNullOrEmpty(typeStr))
            {
                return ToolExecutionResult.Fail("Content and type are required", DateTime.UtcNow - startTime);
            }

            var memoryType = ParseMemoryType(typeStr);
            var classification = MemoryClassification.Private;
            if (args.TryGetProperty("classification", out var classEl))
            {
                classification = classEl.GetString()?.ToLowerInvariant() == "public" 
                    ? MemoryClassification.Public 
                    : MemoryClassification.Private;
            }

            var source = args.TryGetProperty("source", out var sourceEl) ? sourceEl.GetString() : null;

            var memory = await _memoryService.RememberAsync(
                context.TenantId, 
                memoryType, 
                content, 
                classification, 
                source,
                cancellationToken: cancellationToken);

            if (memory == null)
            {
                return ToolExecutionResult.Fail(
                    "Memory was blocked due to sensitive content detection", 
                    DateTime.UtcNow - startTime);
            }

            var response = new
            {
                success = true,
                memoryId = memory.Id,
                message = $"Remembered {classification} {memoryType} fact"
            };

            _logger.LogInformation("Stored memory: {Type} ({Classification})", memoryType, classification);
            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Remember fact failed");
            return ToolExecutionResult.Fail($"Failed to store memory: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }

    private static MemoryType ParseMemoryType(string type)
    {
        return type.ToLowerInvariant().Replace("_", "") switch
        {
            "portfoliofact" => MemoryType.PortfolioFact,
            "visitorinsight" => MemoryType.VisitorInsight,
            "decisionlog" => MemoryType.DecisionLog,
            "learning" => MemoryType.Learning,
            "visitorsuggestion" => MemoryType.VisitorSuggestion,
            "contentanalysis" => MemoryType.ContentAnalysis,
            _ => MemoryType.Learning
        };
    }
}

/// <summary>
/// Recall public memories (for visitors)
/// </summary>
public class RecallPublicMemoriesTool : ITool
{
    private readonly IAgentMemoryService _memoryService;
    private readonly ILogger<RecallPublicMemoriesTool> _logger;

    public RecallPublicMemoriesTool(IAgentMemoryService memoryService, ILogger<RecallPublicMemoriesTool> logger)
    {
        _memoryService = memoryService;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_recall_public_memories",
        Description = "Recall public memories and facts about the portfolio. These are facts the agent has learned that are safe to share with visitors.",
        Category = "memory",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Optional search query to find relevant memories"
                },
                "type": {
                    "type": "string",
                    "enum": ["portfolio_fact", "learning"],
                    "description": "Filter by memory type"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of memories to return",
                    "default": 10
                }
            }
        }
        """).RootElement,
        Tags = ["memory", "read", "read-only", "visitor-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var query = args.TryGetProperty("query", out var queryEl) ? queryEl.GetString() : null;
            var limit = args.TryGetProperty("limit", out var limitEl) ? limitEl.GetInt32() : 10;

            IReadOnlyList<AgentMemory> memories;

            if (!string.IsNullOrEmpty(query))
            {
                memories = await _memoryService.SearchMemoriesAsync(
                    context.TenantId,
                    query,
                    MemoryClassification.Public,
                    limit,
                    cancellationToken);
            }
            else
            {
                memories = await _memoryService.RecallAsync(
                    context.TenantId,
                    MemoryClassification.Public,
                    null,
                    limit,
                    cancellationToken);
            }

            var response = new
            {
                count = memories.Count,
                memories = memories.Select(m => new
                {
                    id = m.Id,
                    type = m.Type.ToString(),
                    content = m.Content,
                    source = m.Source,
                    createdAt = m.CreatedAt
                })
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Recall memories failed");
            return ToolExecutionResult.Fail($"Failed to recall memories: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Recall all memories (for autonomous/owner)
/// </summary>
public class RecallAllMemoriesTool : ITool
{
    private readonly IAgentMemoryService _memoryService;
    private readonly ILogger<RecallAllMemoriesTool> _logger;

    public RecallAllMemoriesTool(IAgentMemoryService memoryService, ILogger<RecallAllMemoriesTool> logger)
    {
        _memoryService = memoryService;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_recall_all_memories",
        Description = "Recall all memories including private ones. Only available to autonomous agent and owner.",
        Category = "memory",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Optional search query to find relevant memories"
                },
                "type": {
                    "type": "string",
                    "enum": ["portfolio_fact", "visitor_insight", "decision_log", "learning", "visitor_suggestion", "content_analysis"],
                    "description": "Filter by memory type"
                },
                "includePrivate": {
                    "type": "boolean",
                    "description": "Include private memories",
                    "default": true
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of memories to return",
                    "default": 20
                }
            }
        }
        """).RootElement,
        Tags = ["memory", "read", "autonomous-allowed", "owner-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var query = args.TryGetProperty("query", out var queryEl) ? queryEl.GetString() : null;
            var limit = args.TryGetProperty("limit", out var limitEl) ? limitEl.GetInt32() : 20;
            var includePrivate = !args.TryGetProperty("includePrivate", out var privateEl) || privateEl.GetBoolean();

            var maxClassification = includePrivate ? MemoryClassification.Private : MemoryClassification.Public;

            IReadOnlyList<AgentMemory> memories;

            if (!string.IsNullOrEmpty(query))
            {
                memories = await _memoryService.SearchMemoriesAsync(
                    context.TenantId,
                    query,
                    maxClassification,
                    limit,
                    cancellationToken);
            }
            else
            {
                memories = await _memoryService.RecallAsync(
                    context.TenantId,
                    maxClassification,
                    null,
                    limit,
                    cancellationToken);
            }

            var response = new
            {
                count = memories.Count,
                memories = memories.Select(m => new
                {
                    id = m.Id,
                    type = m.Type.ToString(),
                    classification = m.Classification.ToString(),
                    content = m.Content,
                    source = m.Source,
                    metadata = m.Metadata,
                    createdAt = m.CreatedAt,
                    expiresAt = m.ExpiresAt
                })
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Recall all memories failed");
            return ToolExecutionResult.Fail($"Failed to recall memories: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Log a decision with reasoning
/// </summary>
public class LogDecisionTool : ITool
{
    private readonly IAgentMemoryService _memoryService;
    private readonly IActivityLogService _activityLog;
    private readonly ILogger<LogDecisionTool> _logger;

    public LogDecisionTool(
        IAgentMemoryService memoryService, 
        IActivityLogService activityLog,
        ILogger<LogDecisionTool> logger)
    {
        _memoryService = memoryService;
        _activityLog = activityLog;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_log_decision",
        Description = "Log a decision the agent made along with its reasoning. This creates transparency and auditability.",
        Category = "memory",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "decision": {
                    "type": "string",
                    "description": "The decision that was made"
                },
                "reasoning": {
                    "type": "string",
                    "description": "The reasoning behind the decision"
                },
                "alternatives": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "Alternative options that were considered"
                },
                "context": {
                    "type": "string",
                    "description": "Additional context about the decision"
                }
            },
            "required": ["decision", "reasoning"]
        }
        """).RootElement,
        Tags = ["memory", "decision", "autonomous-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var decision = args.GetProperty("decision").GetString();
            var reasoning = args.GetProperty("reasoning").GetString();

            if (string.IsNullOrEmpty(decision) || string.IsNullOrEmpty(reasoning))
            {
                return ToolExecutionResult.Fail("Decision and reasoning are required", DateTime.UtcNow - startTime);
            }

            var alternatives = new List<string>();
            if (args.TryGetProperty("alternatives", out var altEl) && altEl.ValueKind == JsonValueKind.Array)
            {
                alternatives = altEl.EnumerateArray()
                    .Select(e => e.GetString())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .Cast<string>()
                    .ToList();
            }

            var additionalContext = args.TryGetProperty("context", out var ctxEl) ? ctxEl.GetString() : null;

            // Store as a memory
            var memoryContent = $"Decision: {decision}\n\nReasoning: {reasoning}";
            if (alternatives.Count > 0)
            {
                memoryContent += $"\n\nAlternatives considered: {string.Join(", ", alternatives)}";
            }
            if (!string.IsNullOrEmpty(additionalContext))
            {
                memoryContent += $"\n\nContext: {additionalContext}";
            }

            await _memoryService.RememberAsync(
                context.TenantId,
                MemoryType.DecisionLog,
                memoryContent,
                MemoryClassification.Private,
                "agent-decision",
                cancellationToken: cancellationToken);

            // Log as activity (public summary)
            await _activityLog.LogAsync(
                context.TenantId,
                ActivityType.DecisionMade,
                $"Made decision: {decision}",
                reasoning,
                isPublic: true,
                cancellationToken: cancellationToken);

            var response = new
            {
                success = true,
                message = "Decision logged"
            };

            _logger.LogInformation("Logged decision: {Decision}", decision);
            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Log decision failed");
            return ToolExecutionResult.Fail($"Failed to log decision: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}
