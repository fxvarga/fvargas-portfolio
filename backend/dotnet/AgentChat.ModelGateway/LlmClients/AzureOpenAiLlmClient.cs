using System.ClientModel;
using System.Text.Json;
using Azure;
using Azure.AI.OpenAI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI.Chat;
using AgentChat.Infrastructure.Configuration;

namespace AgentChat.ModelGateway.LlmClients;

/// <summary>
/// LLM client implementation for Azure OpenAI
/// </summary>
public class AzureOpenAiLlmClient : ILlmClient
{
    private readonly AzureOpenAiOptions _options;
    private readonly ILogger<AzureOpenAiLlmClient> _logger;
    private readonly AzureOpenAIClient? _client;

    public AzureOpenAiLlmClient(
        IOptions<AzureOpenAiOptions> options,
        ILogger<AzureOpenAiLlmClient> logger)
    {
        _options = options.Value;
        _logger = logger;

        if (IsConfigured)
        {
            _client = new AzureOpenAIClient(
                new Uri(_options.Endpoint),
                new AzureKeyCredential(_options.ApiKey));
        }
    }

    public bool IsConfigured => 
        !string.IsNullOrEmpty(_options.Endpoint) && 
        !string.IsNullOrEmpty(_options.ApiKey);

    public string ProviderName => "Azure OpenAI";

    public async Task<LlmCompletionResult> CompleteChatAsync(
        IEnumerable<LlmMessage> messages,
        IEnumerable<LlmTool>? tools = null,
        string? model = null,
        float temperature = 0.7f,
        int maxTokens = 4096,
        LlmStreamCallback? onDelta = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured || _client == null)
            throw new InvalidOperationException("Azure OpenAI is not configured");

        var deployment = model ?? _options.DefaultDeployment;
        var chatClient = _client.GetChatClient(deployment);

        // Convert messages
        var chatMessages = new List<ChatMessage>();
        foreach (var msg in messages)
        {
            // Handle tool result messages
            if (msg.Role == "tool" && !string.IsNullOrEmpty(msg.ToolCallId))
            {
                chatMessages.Add(new ToolChatMessage(msg.ToolCallId, msg.Content ?? ""));
                continue;
            }
            
            // Handle assistant messages with tool calls
            if (msg.Role == "assistant" && msg.ToolCalls != null && msg.ToolCalls.Count > 0)
            {
                var toolCallParts = msg.ToolCalls.Select(tc => 
                    ChatToolCall.CreateFunctionToolCall(tc.Id, tc.FunctionName, BinaryData.FromString(tc.Arguments)));
                
                var assistantMsg = new AssistantChatMessage(toolCallParts);
                if (!string.IsNullOrEmpty(msg.Content))
                {
                    assistantMsg = new AssistantChatMessage(toolCallParts) { Content = { ChatMessageContentPart.CreateTextPart(msg.Content) } };
                }
                chatMessages.Add(assistantMsg);
                continue;
            }
            
            ChatMessage chatMessage = msg.Role switch
            {
                "user" => new UserChatMessage(msg.Content ?? ""),
                "assistant" => new AssistantChatMessage(msg.Content ?? ""),
                "system" => new SystemChatMessage(msg.Content ?? ""),
                _ => new UserChatMessage(msg.Content ?? "")
            };
            chatMessages.Add(chatMessage);
        }

        // Build options
        var options = new ChatCompletionOptions
        {
            Temperature = temperature,
            MaxOutputTokenCount = maxTokens
        };

        // Add tools
        if (tools != null)
        {
            foreach (var tool in tools)
            {
                options.Tools.Add(ChatTool.CreateFunctionTool(
                    tool.Name,
                    tool.Description,
                    BinaryData.FromString(tool.ParametersSchema.GetRawText())));
            }
        }

        var fullContent = new System.Text.StringBuilder();
        var toolCalls = new Dictionary<int, (string Id, string Name, System.Text.StringBuilder Args)>();
        int tokenIndex = 0;

        // Stream the response
        await foreach (var update in chatClient.CompleteChatStreamingAsync(chatMessages, options, cancellationToken))
        {
            foreach (var part in update.ContentUpdate)
            {
                if (!string.IsNullOrEmpty(part.Text))
                {
                    fullContent.Append(part.Text);
                    if (onDelta != null)
                    {
                        await onDelta(part.Text, tokenIndex++);
                    }
                }
            }

            foreach (var toolCallUpdate in update.ToolCallUpdates)
            {
                int index = toolCallUpdate.Index;
                
                if (!toolCalls.ContainsKey(index))
                {
                    toolCalls[index] = (
                        toolCallUpdate.ToolCallId ?? Guid.NewGuid().ToString(),
                        toolCallUpdate.FunctionName ?? "",
                        new System.Text.StringBuilder()
                    );
                }

                if (!string.IsNullOrEmpty(toolCallUpdate.FunctionName) && 
                    string.IsNullOrEmpty(toolCalls[index].Name))
                {
                    toolCalls[index] = (
                        toolCalls[index].Id,
                        toolCallUpdate.FunctionName,
                        toolCalls[index].Args
                    );
                }

                if (toolCallUpdate.FunctionArgumentsUpdate != null && 
                    toolCallUpdate.FunctionArgumentsUpdate.ToMemory().Length > 0)
                {
                    toolCalls[index].Args.Append(toolCallUpdate.FunctionArgumentsUpdate.ToString());
                }
            }
        }

        return new LlmCompletionResult
        {
            Content = fullContent.ToString(),
            ToolCalls = toolCalls.Values
                .Where(tc => !string.IsNullOrEmpty(tc.Name))
                .Select(tc => new LlmToolCall(tc.Id, tc.Name, tc.Args.ToString()))
                .ToList(),
            FinishReason = toolCalls.Count > 0 ? "tool_calls" : "stop",
            InputTokens = 0, // TODO: Get from response usage
            OutputTokens = 0
        };
    }
}
