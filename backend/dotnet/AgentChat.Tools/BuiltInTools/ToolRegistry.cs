using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;

namespace AgentChat.Tools.BuiltInTools;

/// <summary>
/// Registry of available tools
/// </summary>
public class ToolRegistry : IToolRegistry
{
    private readonly Dictionary<string, ITool> _tools;

    public ToolRegistry(IEnumerable<ITool> tools)
    {
        _tools = tools.ToDictionary(t => t.Definition.Name, t => t);
    }

    public IReadOnlyList<ToolDefinition> GetAllTools() =>
        _tools.Values.Select(t => t.Definition).ToList();

    public IReadOnlyList<ToolDefinition> GetTools(string? category = null, IEnumerable<string>? tags = null)
    {
        var tools = _tools.Values.Select(t => t.Definition);

        if (!string.IsNullOrEmpty(category))
        {
            tools = tools.Where(t => t.Category == category);
        }

        if (tags != null && tags.Any())
        {
            var tagSet = tags.ToHashSet();
            tools = tools.Where(t => t.Tags.Any(tag => tagSet.Contains(tag)));
        }

        return tools.ToList();
    }

    public ToolDefinition? GetTool(string name) =>
        _tools.TryGetValue(name, out var tool) ? tool.Definition : null;

    public bool HasTool(string name) => _tools.ContainsKey(name);

    public ToolValidationResult ValidateArgs(string toolName, JsonElement args)
    {
        if (!_tools.TryGetValue(toolName, out var tool))
        {
            return ToolValidationResult.Failure($"Tool '{toolName}' not found");
        }

        // TODO: Implement JSON schema validation
        return ToolValidationResult.Success();
    }
}

/// <summary>
/// Executor that delegates to tool implementations
/// </summary>
public class ToolExecutor : IToolExecutor
{
    private readonly Dictionary<string, ITool> _tools;
    private readonly ILogger<ToolExecutor> _logger;

    public ToolExecutor(IEnumerable<ITool> tools, ILogger<ToolExecutor> logger)
    {
        _tools = tools.ToDictionary(t => t.Definition.Name, t => t);
        _logger = logger;
    }

    public async Task<ToolExecutionResult> ExecuteAsync(
        string toolName,
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        if (!_tools.TryGetValue(toolName, out var tool))
        {
            return ToolExecutionResult.Fail($"Tool '{toolName}' not found", TimeSpan.Zero);
        }

        var startTime = DateTime.UtcNow;

        try
        {
            _logger.LogInformation("Executing tool {ToolName} for run {RunId}",
                toolName, context.RunId);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(context.Timeout);

            var result = await tool.ExecuteAsync(args, context, cts.Token);
            
            _logger.LogInformation("Tool {ToolName} completed in {Duration}ms",
                toolName, result.Duration.TotalMilliseconds);

            return result;
        }
        catch (OperationCanceledException)
        {
            var duration = DateTime.UtcNow - startTime;
            return ToolExecutionResult.Fail("Tool execution timed out", duration);
        }
        catch (Exception ex)
        {
            var duration = DateTime.UtcNow - startTime;
            _logger.LogError(ex, "Tool {ToolName} failed", toolName);
            return ToolExecutionResult.Fail(ex.Message, duration);
        }
    }
}
