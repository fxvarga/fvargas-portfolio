using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using FV.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace AgentChat.PortfolioAgent.Tools;

/// <summary>
/// Search portfolio content via Elasticsearch
/// </summary>
public class PortfolioSearchTool : ITool
{
    private readonly ISearchService _searchService;
    private readonly ILogger<PortfolioSearchTool> _logger;

    public PortfolioSearchTool(ISearchService searchService, ILogger<PortfolioSearchTool> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_search",
        Description = "Search across all portfolio content including blog posts, projects, case studies, and about sections. Returns matching content with relevance scores and snippets.",
        Category = "portfolio",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query - can be keywords, phrases, or questions"
                },
                "contentTypes": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "Optional filter by content type: blog-post, case-study-page, hero, about, services, contact"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return",
                    "default": 10
                },
                "useSemanticSearch": {
                    "type": "boolean",
                    "description": "Whether to use semantic (AI-powered) search for better understanding of intent",
                    "default": false
                }
            },
            "required": ["query"]
        }
        """).RootElement,
        Tags = ["portfolio", "search", "read-only", "visitor-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var query = args.GetProperty("query").GetString();
            if (string.IsNullOrEmpty(query))
            {
                return ToolExecutionResult.Fail("Query is required", DateTime.UtcNow - startTime);
            }

            var limit = args.TryGetProperty("limit", out var limitEl) ? limitEl.GetInt32() : 10;
            var useSemantic = args.TryGetProperty("useSemanticSearch", out var semanticEl) && semanticEl.GetBoolean();

            List<string>? contentTypes = null;
            if (args.TryGetProperty("contentTypes", out var typesEl) && typesEl.ValueKind == JsonValueKind.Array)
            {
                contentTypes = typesEl.EnumerateArray()
                    .Select(e => e.GetString())
                    .Where(s => !string.IsNullOrEmpty(s))
                    .Cast<string>()
                    .ToList();
            }

            _logger.LogInformation("Searching portfolio for '{Query}' (semantic: {Semantic})", query, useSemantic);

            var searchOptions = new SearchOptions
            {
                PortfolioId = context.TenantId,
                Query = query,
                Limit = Math.Min(limit, 20), // Cap at 20
                EntityTypes = contentTypes,
                UseSemanticSearch = useSemantic
            };

            var results = await _searchService.SearchAsync(searchOptions, cancellationToken);

            var response = new
            {
                query,
                totalResults = results.Count,
                results = results.Select(r => new
                {
                    id = r.Id,
                    title = r.Title,
                    type = r.EntityType,
                    section = r.Section,
                    url = r.Url,
                    snippet = r.Snippet,
                    score = Math.Round(r.Score, 2),
                    highlights = r.Highlights
                })
            };

            var duration = DateTime.UtcNow - startTime;
            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), duration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Portfolio search failed");
            return ToolExecutionResult.Fail($"Search failed: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Get detailed content by ID
/// </summary>
public class PortfolioGetContentTool : ITool
{
    private readonly ISearchService _searchService;
    private readonly ILogger<PortfolioGetContentTool> _logger;

    public PortfolioGetContentTool(ISearchService searchService, ILogger<PortfolioGetContentTool> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_get_content",
        Description = "Retrieve detailed content for a specific portfolio item by searching for its exact title or ID.",
        Category = "portfolio",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "The title or ID of the content to retrieve"
                },
                "contentType": {
                    "type": "string",
                    "description": "The type of content: blog-post, case-study-page, hero, about, services, contact"
                }
            },
            "required": ["title"]
        }
        """).RootElement,
        Tags = ["portfolio", "read", "read-only", "visitor-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var title = args.GetProperty("title").GetString();
            if (string.IsNullOrEmpty(title))
            {
                return ToolExecutionResult.Fail("Title is required", DateTime.UtcNow - startTime);
            }

            var contentType = args.TryGetProperty("contentType", out var typeEl) ? typeEl.GetString() : null;

            _logger.LogInformation("Getting portfolio content: '{Title}'", title);

            var searchOptions = new SearchOptions
            {
                PortfolioId = context.TenantId,
                Query = title,
                Limit = 1,
                EntityTypes = contentType != null ? new List<string> { contentType } : null
            };

            var results = await _searchService.SearchAsync(searchOptions, cancellationToken);

            if (results.Count == 0)
            {
                return ToolExecutionResult.Ok(
                    JsonSerializer.SerializeToElement(new { found = false, message = $"No content found matching '{title}'" }),
                    DateTime.UtcNow - startTime);
            }

            var content = results[0];
            var response = new
            {
                found = true,
                id = content.Id,
                title = content.Title,
                type = content.EntityType,
                section = content.Section,
                url = content.Url,
                content = content.Snippet // In production, fetch full content from DB
            };

            var duration = DateTime.UtcNow - startTime;
            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), duration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get content failed");
            return ToolExecutionResult.Fail($"Get content failed: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Get search suggestions/autocomplete
/// </summary>
public class PortfolioSuggestionsTool : ITool
{
    private readonly ISearchService _searchService;
    private readonly ILogger<PortfolioSuggestionsTool> _logger;

    public PortfolioSuggestionsTool(ISearchService searchService, ILogger<PortfolioSuggestionsTool> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_get_suggestions",
        Description = "Get search suggestions based on a prefix. Useful for understanding what content is available.",
        Category = "portfolio",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "prefix": {
                    "type": "string",
                    "description": "The prefix to get suggestions for"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of suggestions",
                    "default": 5
                }
            },
            "required": ["prefix"]
        }
        """).RootElement,
        Tags = ["portfolio", "search", "read-only", "visitor-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var prefix = args.GetProperty("prefix").GetString();
            if (string.IsNullOrEmpty(prefix))
            {
                return ToolExecutionResult.Fail("Prefix is required", DateTime.UtcNow - startTime);
            }

            var limit = args.TryGetProperty("limit", out var limitEl) ? limitEl.GetInt32() : 5;

            var suggestions = await _searchService.GetSuggestionsAsync(prefix, context.TenantId, limit, cancellationToken);

            var response = new
            {
                prefix,
                suggestions = suggestions
            };

            var duration = DateTime.UtcNow - startTime;
            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), duration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get suggestions failed");
            return ToolExecutionResult.Fail($"Get suggestions failed: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}
