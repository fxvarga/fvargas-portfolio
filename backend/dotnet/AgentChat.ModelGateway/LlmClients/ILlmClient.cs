using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.ModelGateway.LlmClients;

/// <summary>
/// Represents a message in a chat conversation
/// </summary>
public record LlmMessage
{
    public required string Role { get; init; }
    public string? Content { get; init; }
    /// <summary>
    /// For assistant messages that made tool calls
    /// </summary>
    public List<LlmToolCall>? ToolCalls { get; init; }
    /// <summary>
    /// For tool result messages - the ID of the tool call this is responding to
    /// </summary>
    public string? ToolCallId { get; init; }
}

/// <summary>
/// Represents a tool/function definition for the LLM
/// </summary>
public record LlmTool(string Name, string Description, JsonElement ParametersSchema);

/// <summary>
/// Represents a tool call from the LLM
/// </summary>
public record LlmToolCall(string Id, string FunctionName, string Arguments);

/// <summary>
/// Result of an LLM completion
/// </summary>
public record LlmCompletionResult
{
    public required string Content { get; init; }
    public List<LlmToolCall> ToolCalls { get; init; } = [];
    public string FinishReason { get; init; } = "stop";
    public int InputTokens { get; init; }
    public int OutputTokens { get; init; }
}

/// <summary>
/// Delegate for receiving streaming delta updates
/// </summary>
public delegate Task LlmStreamCallback(string delta, int tokenIndex);

/// <summary>
/// Abstraction for LLM clients (Azure OpenAI, OpenAI, Ollama, etc.)
/// </summary>
public interface ILlmClient
{
    /// <summary>
    /// Check if the client is properly configured
    /// </summary>
    bool IsConfigured { get; }
    
    /// <summary>
    /// Get the provider name for logging
    /// </summary>
    string ProviderName { get; }
    
    /// <summary>
    /// Complete a chat conversation with optional tool calling
    /// </summary>
    Task<LlmCompletionResult> CompleteChatAsync(
        IEnumerable<LlmMessage> messages,
        IEnumerable<LlmTool>? tools = null,
        string? model = null,
        float temperature = 0.7f,
        int maxTokens = 4096,
        LlmStreamCallback? onDelta = null,
        CancellationToken cancellationToken = default);
}
