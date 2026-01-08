using System.Text.Json;
using AgentChat.Shared.Models;

namespace AgentChat.Shared.Contracts;

/// <summary>
/// Gateway for LLM interactions
/// </summary>
public interface IModelGateway
{
    /// <summary>
    /// Send a chat completion request with streaming
    /// </summary>
    IAsyncEnumerable<LlmStreamChunk> StreamChatCompletionAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Send a chat completion request and wait for full response
    /// </summary>
    Task<ChatCompletionResponse> ChatCompletionAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Chat completion request
/// </summary>
public record ChatCompletionRequest
{
    public required Guid RunId { get; init; }
    public required Guid StepId { get; init; }
    public required Guid TenantId { get; init; }
    public required Guid CorrelationId { get; init; }
    
    public required string Model { get; init; }
    public required IReadOnlyList<ChatMessage> Messages { get; init; }
    public IReadOnlyList<ToolDefinition>? Tools { get; init; }
    public string? ToolChoice { get; init; }
    
    public double Temperature { get; init; } = 0.7;
    public int? MaxTokens { get; init; }
    public double? TopP { get; init; }
    public string? SystemPrompt { get; init; }
}

/// <summary>
/// Chat message for LLM
/// </summary>
public record ChatMessage
{
    public required string Role { get; init; }
    public string? Content { get; init; }
    public string? Name { get; init; }
    public IReadOnlyList<ToolCallMessage>? ToolCalls { get; init; }
    public string? ToolCallId { get; init; }
}

/// <summary>
/// Tool call in a message
/// </summary>
public record ToolCallMessage
{
    public required string Id { get; init; }
    public required string Type { get; init; }
    public required ToolCallFunction Function { get; init; }
}

/// <summary>
/// Tool call function details
/// </summary>
public record ToolCallFunction
{
    public required string Name { get; init; }
    public required string Arguments { get; init; }
}

/// <summary>
/// Streaming chunk from LLM
/// </summary>
public record LlmStreamChunk
{
    public LlmChunkType Type { get; init; }
    public string? ContentDelta { get; init; }
    public ToolCallDelta? ToolCallDelta { get; init; }
    public LlmUsage? Usage { get; init; }
    public string? FinishReason { get; init; }
}

/// <summary>
/// Type of streaming chunk
/// </summary>
public enum LlmChunkType
{
    ContentDelta,
    ToolCallDelta,
    Usage,
    Done
}

/// <summary>
/// Tool call delta during streaming
/// </summary>
public record ToolCallDelta
{
    public int Index { get; init; }
    public string? Id { get; init; }
    public string? Name { get; init; }
    public string? ArgumentsDelta { get; init; }
}

/// <summary>
/// Token usage information
/// </summary>
public record LlmUsage
{
    public int PromptTokens { get; init; }
    public int CompletionTokens { get; init; }
    public int TotalTokens { get; init; }
}

/// <summary>
/// Full chat completion response
/// </summary>
public record ChatCompletionResponse
{
    public required string Id { get; init; }
    public required string Model { get; init; }
    public string? Content { get; init; }
    public IReadOnlyList<ToolCallMessage>? ToolCalls { get; init; }
    public string? FinishReason { get; init; }
    public required LlmUsage Usage { get; init; }
}
