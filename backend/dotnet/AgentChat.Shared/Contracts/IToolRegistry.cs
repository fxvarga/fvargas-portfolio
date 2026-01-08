using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Contracts;

/// <summary>
/// Registry for tool definitions
/// </summary>
public interface IToolRegistry
{
    /// <summary>
    /// Get all available tools
    /// </summary>
    IReadOnlyList<ToolDefinition> GetAllTools();

    /// <summary>
    /// Get tools filtered by category or tags
    /// </summary>
    IReadOnlyList<ToolDefinition> GetTools(string? category = null, IEnumerable<string>? tags = null);

    /// <summary>
    /// Get a specific tool by name
    /// </summary>
    ToolDefinition? GetTool(string name);

    /// <summary>
    /// Check if a tool exists
    /// </summary>
    bool HasTool(string name);

    /// <summary>
    /// Validate tool arguments against schema
    /// </summary>
    ToolValidationResult ValidateArgs(string toolName, JsonElement args);
}

/// <summary>
/// Result of tool argument validation
/// </summary>
public record ToolValidationResult
{
    public bool IsValid { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
    
    public static ToolValidationResult Success() => new() { IsValid = true };
    public static ToolValidationResult Failure(params string[] errors) => 
        new() { IsValid = false, Errors = errors };
}

/// <summary>
/// Tool executor interface
/// </summary>
public interface IToolExecutor
{
    /// <summary>
    /// Execute a tool with the given arguments
    /// </summary>
    /// <param name="toolName">Name of the tool to execute</param>
    /// <param name="args">Arguments for the tool</param>
    /// <param name="context">Execution context</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Tool execution result</returns>
    Task<ToolExecutionResult> ExecuteAsync(
        string toolName,
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Context for tool execution
/// </summary>
public record ToolExecutionContext
{
    public required Guid RunId { get; init; }
    public required Guid StepId { get; init; }
    public required Guid ToolCallId { get; init; }
    public required Guid TenantId { get; init; }
    public required Guid UserId { get; init; }
    public required string IdempotencyKey { get; init; }
    public required Guid CorrelationId { get; init; }
    public TimeSpan Timeout { get; init; } = TimeSpan.FromMinutes(5);
    public int RetryAttempt { get; init; } = 0;
}

/// <summary>
/// Result of tool execution
/// </summary>
public record ToolExecutionResult
{
    public bool Success { get; init; }
    public JsonElement? Result { get; init; }
    public string? Error { get; init; }
    public TimeSpan Duration { get; init; }
    public IReadOnlyList<ToolArtifact>? Artifacts { get; init; }
    public bool ShouldRetry { get; init; }
    
    public static ToolExecutionResult Ok(JsonElement result, TimeSpan duration, IReadOnlyList<ToolArtifact>? artifacts = null) =>
        new() { Success = true, Result = result, Duration = duration, Artifacts = artifacts };
    
    public static ToolExecutionResult Fail(string error, TimeSpan duration, bool shouldRetry = false) =>
        new() { Success = false, Error = error, Duration = duration, ShouldRetry = shouldRetry };
}

/// <summary>
/// Artifact produced by tool execution
/// </summary>
public record ToolArtifact
{
    public required string Kind { get; init; }
    public string? MimeType { get; init; }
    public JsonElement? Content { get; init; }
    public byte[]? BinaryContent { get; init; }
    public string? Uri { get; init; }
}

/// <summary>
/// Interface for individual tool implementations
/// </summary>
public interface ITool
{
    /// <summary>
    /// Tool definition including schema and metadata
    /// </summary>
    ToolDefinition Definition { get; }
    
    /// <summary>
    /// Execute the tool
    /// </summary>
    Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Marker interface for tools that require approval
/// </summary>
public interface IRequiresApproval
{
    /// <summary>
    /// Generate a human-readable summary of what this tool call will do
    /// </summary>
    string GenerateSummary(JsonElement args);
}
