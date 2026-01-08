using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;

namespace AgentChat.Tools.BuiltInTools;

/// <summary>
/// Web search tool - Low risk, read-only
/// </summary>
public class WebSearchTool : ITool
{
    private readonly HttpClient _httpClient;

    public WebSearchTool(IHttpClientFactory httpClientFactory)
    {
        _httpClient = httpClientFactory.CreateClient();
    }

    public ToolDefinition Definition => new()
    {
        Name = "web_search",
        Description = "Search the web for information",
        Category = "search",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                },
                "maxResults": {
                    "type": "integer",
                    "description": "Maximum number of results to return",
                    "default": 5
                }
            },
            "required": ["query"]
        }
        """).RootElement,
        Tags = ["search", "web", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        var query = args.GetProperty("query").GetString();
        if (string.IsNullOrEmpty(query))
        {
            return ToolExecutionResult.Fail("Query is required", DateTime.UtcNow - startTime);
        }

        // TODO: Implement actual web search
        // For now, return a mock response
        var result = JsonSerializer.SerializeToElement(new
        {
            query,
            results = new[]
            {
                new { title = "Sample Result", url = "https://example.com", snippet = "This is a sample search result" }
            }
        });

        var duration = DateTime.UtcNow - startTime;
        return ToolExecutionResult.Ok(result, duration);
    }
}

/// <summary>
/// File write tool - High risk, requires approval
/// </summary>
public class FileWriteTool : ITool, IRequiresApproval
{
    public ToolDefinition Definition => new()
    {
        Name = "file_write",
        Description = "Write content to a file",
        Category = "filesystem",
        RiskTier = RiskTier.High,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file to write"
                },
                "content": {
                    "type": "string",
                    "description": "Content to write to the file"
                },
                "mode": {
                    "type": "string",
                    "enum": ["overwrite", "append"],
                    "description": "Write mode",
                    "default": "overwrite"
                }
            },
            "required": ["path", "content"]
        }
        """).RootElement,
        Tags = ["filesystem", "write", "dangerous"]
    };

    public string GenerateSummary(JsonElement args)
    {
        var path = args.GetProperty("path").GetString();
        var mode = args.TryGetProperty("mode", out var modeEl) ? modeEl.GetString() : "overwrite";
        return $"Write to file '{path}' (mode: {mode})";
    }

    public Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        var path = args.GetProperty("path").GetString();
        var content = args.GetProperty("content").GetString();

        if (string.IsNullOrEmpty(path) || content == null)
        {
            return Task.FromResult(ToolExecutionResult.Fail("Path and content are required", DateTime.UtcNow - startTime));
        }

        // TODO: Implement actual file write with sandboxing
        var result = JsonSerializer.SerializeToElement(new
        {
            success = true,
            path,
            bytesWritten = content.Length
        });

        var duration = DateTime.UtcNow - startTime;
        return Task.FromResult(ToolExecutionResult.Ok(result, duration));
    }
}

/// <summary>
/// Code execution tool - Critical risk, requires approval
/// </summary>
public class CodeExecutionTool : ITool, IRequiresApproval
{
    public ToolDefinition Definition => new()
    {
        Name = "code_execute",
        Description = "Execute code in a sandboxed environment",
        Category = "code",
        RiskTier = RiskTier.Critical,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "language": {
                    "type": "string",
                    "enum": ["python", "javascript", "bash"],
                    "description": "Programming language"
                },
                "code": {
                    "type": "string",
                    "description": "Code to execute"
                },
                "timeout": {
                    "type": "integer",
                    "description": "Execution timeout in seconds",
                    "default": 30
                }
            },
            "required": ["language", "code"]
        }
        """).RootElement,
        Tags = ["code", "execute", "dangerous", "sandbox"]
    };

    public string GenerateSummary(JsonElement args)
    {
        var language = args.GetProperty("language").GetString();
        var code = args.GetProperty("code").GetString();
        var preview = code?.Length > 100 ? code[..100] + "..." : code;
        return $"Execute {language} code: {preview}";
    }

    public Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        var language = args.GetProperty("language").GetString();
        var code = args.GetProperty("code").GetString();

        if (string.IsNullOrEmpty(language) || string.IsNullOrEmpty(code))
        {
            return Task.FromResult(ToolExecutionResult.Fail("Language and code are required", DateTime.UtcNow - startTime));
        }

        // TODO: Implement actual sandboxed code execution
        var result = JsonSerializer.SerializeToElement(new
        {
            success = true,
            output = "Code execution not yet implemented",
            exitCode = 0
        });

        var duration = DateTime.UtcNow - startTime;
        return Task.FromResult(ToolExecutionResult.Ok(result, duration));
    }
}
