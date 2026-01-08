using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using AgentChat.Infrastructure.Configuration;

namespace AgentChat.ModelGateway.LlmClients;

/// <summary>
/// LLM client for OpenAI-compatible APIs (Ollama, OpenRouter, LM Studio, etc.)
/// </summary>
public class OpenAiCompatibleLlmClient : ILlmClient
{
    private readonly OpenAiCompatibleOptions _options;
    private readonly ILogger<OpenAiCompatibleLlmClient> _logger;
    private readonly HttpClient _httpClient;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public OpenAiCompatibleLlmClient(
        IOptions<OpenAiCompatibleOptions> options,
        ILogger<OpenAiCompatibleLlmClient> logger,
        HttpClient? httpClient = null)
    {
        _options = options.Value;
        _logger = logger;
        _httpClient = httpClient ?? new HttpClient();

        if (!string.IsNullOrEmpty(_options.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_options.ApiKey}");
        }
    }

    public bool IsConfigured => 
        _options.Enabled && 
        !string.IsNullOrEmpty(_options.BaseUrl);

    public string ProviderName => "OpenAI-Compatible";

    public async Task<LlmCompletionResult> CompleteChatAsync(
        IEnumerable<LlmMessage> messages,
        IEnumerable<LlmTool>? tools = null,
        string? model = null,
        float temperature = 0.7f,
        int maxTokens = 4096,
        LlmStreamCallback? onDelta = null,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("OpenAI-compatible provider is not configured");

        var endpoint = $"{_options.BaseUrl.TrimEnd('/')}/chat/completions";
        var modelName = model ?? _options.DefaultModel;

        _logger.LogInformation("Calling OpenAI-compatible API at {Endpoint} with model {Model}", 
            endpoint, modelName);

        var request = new OpenAiRequest
        {
            Model = modelName,
            Messages = messages.Select(m => new OpenAiMessage 
            { 
                Role = m.Role, 
                Content = m.Content 
            }).ToList(),
            Temperature = temperature,
            MaxTokens = maxTokens,
            Stream = onDelta != null
        };

        // Add tools if provided (only if provider supports it)
        if (tools?.Any() == true)
        {
            request.Tools = tools.Select(t => new OpenAiTool
            {
                Type = "function",
                Function = new OpenAiFunction
                {
                    Name = t.Name,
                    Description = t.Description,
                    Parameters = t.ParametersSchema
                }
            }).ToList();
        }

        var content = new StringContent(
            JsonSerializer.Serialize(request, JsonOptions),
            Encoding.UTF8,
            "application/json");

        if (request.Stream)
        {
            return await StreamCompletionAsync(endpoint, content, onDelta!, cancellationToken);
        }
        else
        {
            return await NonStreamCompletionAsync(endpoint, content, cancellationToken);
        }
    }

    private async Task<LlmCompletionResult> NonStreamCompletionAsync(
        string endpoint,
        HttpContent content,
        CancellationToken cancellationToken)
    {
        var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OpenAiResponse>(JsonOptions, cancellationToken);
        
        if (result?.Choices == null || result.Choices.Count == 0)
        {
            return new LlmCompletionResult { Content = "" };
        }

        var choice = result.Choices[0];
        var toolCalls = new List<LlmToolCall>();

        if (choice.Message?.ToolCalls != null)
        {
            foreach (var tc in choice.Message.ToolCalls)
            {
                if (tc.Function != null)
                {
                    toolCalls.Add(new LlmToolCall(
                        tc.Id ?? Guid.NewGuid().ToString(),
                        tc.Function.Name ?? "",
                        tc.Function.Arguments ?? "{}"));
                }
            }
        }

        return new LlmCompletionResult
        {
            Content = choice.Message?.Content ?? "",
            ToolCalls = toolCalls,
            FinishReason = choice.FinishReason ?? "stop",
            InputTokens = result.Usage?.PromptTokens ?? 0,
            OutputTokens = result.Usage?.CompletionTokens ?? 0
        };
    }

    private async Task<LlmCompletionResult> StreamCompletionAsync(
        string endpoint,
        HttpContent content,
        LlmStreamCallback onDelta,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, endpoint) { Content = content };
        var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        var fullContent = new StringBuilder();
        var toolCalls = new Dictionary<int, (string Id, string Name, StringBuilder Args)>();
        int tokenIndex = 0;
        string finishReason = "stop";

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (string.IsNullOrEmpty(line) || !line.StartsWith("data: "))
                continue;

            var data = line[6..];
            if (data == "[DONE]")
                break;

            try
            {
                var chunk = JsonSerializer.Deserialize<OpenAiStreamChunk>(data, JsonOptions);
                if (chunk?.Choices == null || chunk.Choices.Count == 0)
                    continue;

                var delta = chunk.Choices[0].Delta;
                
                if (!string.IsNullOrEmpty(delta?.Content))
                {
                    fullContent.Append(delta.Content);
                    await onDelta(delta.Content, tokenIndex++);
                }

                if (delta?.ToolCalls != null)
                {
                    foreach (var tc in delta.ToolCalls)
                    {
                        int index = tc.Index ?? 0;
                        
                        if (!toolCalls.ContainsKey(index))
                        {
                            toolCalls[index] = (
                                tc.Id ?? Guid.NewGuid().ToString(),
                                tc.Function?.Name ?? "",
                                new StringBuilder()
                            );
                        }

                        if (!string.IsNullOrEmpty(tc.Function?.Name))
                        {
                            toolCalls[index] = (
                                toolCalls[index].Id,
                                tc.Function.Name,
                                toolCalls[index].Args
                            );
                        }

                        if (!string.IsNullOrEmpty(tc.Function?.Arguments))
                        {
                            toolCalls[index].Args.Append(tc.Function.Arguments);
                        }
                    }
                }

                if (!string.IsNullOrEmpty(chunk.Choices[0].FinishReason))
                {
                    finishReason = chunk.Choices[0].FinishReason!;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogDebug(ex, "Failed to parse streaming chunk: {Data}", data);
            }
        }

        return new LlmCompletionResult
        {
            Content = fullContent.ToString(),
            ToolCalls = toolCalls.Values
                .Where(tc => !string.IsNullOrEmpty(tc.Name))
                .Select(tc => new LlmToolCall(tc.Id, tc.Name, tc.Args.ToString()))
                .ToList(),
            FinishReason = toolCalls.Count > 0 ? "tool_calls" : finishReason
        };
    }

    // OpenAI API DTOs
    private class OpenAiRequest
    {
        public string Model { get; set; } = "";
        public List<OpenAiMessage> Messages { get; set; } = [];
        public float Temperature { get; set; }
        public int MaxTokens { get; set; }
        public bool Stream { get; set; }
        public List<OpenAiTool>? Tools { get; set; }
    }

    private class OpenAiMessage
    {
        public string Role { get; set; } = "";
        public string Content { get; set; } = "";
    }

    private class OpenAiTool
    {
        public string Type { get; set; } = "function";
        public OpenAiFunction? Function { get; set; }
    }

    private class OpenAiFunction
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public JsonElement? Parameters { get; set; }
        public string? Arguments { get; set; }
    }

    private class OpenAiResponse
    {
        public List<OpenAiChoice>? Choices { get; set; }
        public OpenAiUsage? Usage { get; set; }
    }

    private class OpenAiChoice
    {
        public OpenAiResponseMessage? Message { get; set; }
        public string? FinishReason { get; set; }
    }

    private class OpenAiResponseMessage
    {
        public string? Role { get; set; }
        public string? Content { get; set; }
        public List<OpenAiToolCall>? ToolCalls { get; set; }
    }

    private class OpenAiToolCall
    {
        public string? Id { get; set; }
        public string? Type { get; set; }
        public OpenAiFunction? Function { get; set; }
    }

    private class OpenAiUsage
    {
        public int PromptTokens { get; set; }
        public int CompletionTokens { get; set; }
        public int TotalTokens { get; set; }
    }

    private class OpenAiStreamChunk
    {
        public List<OpenAiStreamChoice>? Choices { get; set; }
    }

    private class OpenAiStreamChoice
    {
        public OpenAiStreamDelta? Delta { get; set; }
        public string? FinishReason { get; set; }
    }

    private class OpenAiStreamDelta
    {
        public string? Role { get; set; }
        public string? Content { get; set; }
        public List<OpenAiStreamToolCall>? ToolCalls { get; set; }
    }

    private class OpenAiStreamToolCall
    {
        public int? Index { get; set; }
        public string? Id { get; set; }
        public string? Type { get; set; }
        public OpenAiFunction? Function { get; set; }
    }
}
