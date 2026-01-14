using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using Microsoft.AspNetCore.Mvc;

namespace AgentChat.ApiBff.Endpoints;

public static class ToolsEndpoints
{
    public static void MapToolsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tools")
            .RequireAuthorization();

        group.MapGet("", ListTools);
        group.MapGet("{name}", GetTool);
        group.MapGet("categories", GetCategories);
        group.MapPost("{name}/test", TestTool);
        group.MapGet("export/markdown", ExportMarkdown);
    }

    /// <summary>
    /// List all available tools with optional category filter
    /// </summary>
    private static IResult ListTools(
        [FromServices] IToolRegistry toolRegistry,
        [FromQuery] string? category = null)
    {
        var tools = string.IsNullOrEmpty(category) 
            ? toolRegistry.GetAllTools() 
            : toolRegistry.GetTools(category);

        var toolDtos = tools.Select(MapToolToDto).OrderBy(t => t.Category).ThenBy(t => t.Name).ToList();

        return Results.Ok(new ToolListResponse
        {
            Tools = toolDtos,
            TotalCount = toolDtos.Count
        });
    }

    /// <summary>
    /// Get a single tool by name with full details
    /// </summary>
    private static IResult GetTool(
        [FromServices] IToolRegistry toolRegistry,
        string name)
    {
        var tool = toolRegistry.GetTool(name);
        if (tool == null)
            return Results.NotFound($"Tool '{name}' not found");

        return Results.Ok(MapToolToDetailDto(tool));
    }

    /// <summary>
    /// Get all tool categories with counts
    /// </summary>
    private static IResult GetCategories(
        [FromServices] IToolRegistry toolRegistry)
    {
        var tools = toolRegistry.GetAllTools();
        var categories = tools
            .GroupBy(t => t.Category ?? "uncategorized")
            .Select(g => new ToolCategoryDto
            {
                Name = g.Key,
                Count = g.Count(),
                RiskBreakdown = new Dictionary<string, int>
                {
                    ["Low"] = g.Count(t => t.RiskTier == RiskTier.Low),
                    ["Medium"] = g.Count(t => t.RiskTier == RiskTier.Medium),
                    ["High"] = g.Count(t => t.RiskTier == RiskTier.High),
                    ["Critical"] = g.Count(t => t.RiskTier == RiskTier.Critical)
                }
            })
            .OrderBy(c => c.Name)
            .ToList();

        return Results.Ok(categories);
    }

    /// <summary>
    /// Test a tool with the provided arguments (proxies to tools service)
    /// </summary>
    private static async Task<IResult> TestTool(
        string name,
        HttpRequest request,
        [FromServices] IHttpClientFactory httpClientFactory,
        [FromServices] IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var toolsServiceUrl = configuration["ToolsService:BaseUrl"] ?? "http://agentchat-tools:8080";
        
        // Read the request body
        using var reader = new StreamReader(request.Body);
        var body = await reader.ReadToEndAsync(cancellationToken);
        
        // Forward the request to the tools service
        var client = httpClientFactory.CreateClient();
        var forwardRequest = new HttpRequestMessage(HttpMethod.Post, $"{toolsServiceUrl}/api/tools/{name}/test")
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
        };
        
        // Forward tenant header
        if (request.Headers.TryGetValue("X-Tenant-Id", out var tenantId))
        {
            forwardRequest.Headers.Add("X-Tenant-Id", tenantId.ToString());
        }
        
        try
        {
            var response = await client.SendAsync(forwardRequest, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            
            if (response.IsSuccessStatusCode)
            {
                var result = JsonDocument.Parse(responseBody);
                return Results.Ok(result.RootElement);
            }
            
            return Results.Problem(
                statusCode: (int)response.StatusCode,
                detail: responseBody
            );
        }
        catch (HttpRequestException ex)
        {
            return Results.Problem(
                statusCode: 503,
                detail: $"Tools service unavailable: {ex.Message}"
            );
        }
    }

    /// <summary>
    /// Export all tools as a markdown document
    /// </summary>
    private static IResult ExportMarkdown(
        [FromServices] IToolRegistry toolRegistry)
    {
        var tools = toolRegistry.GetAllTools();
        var sb = new System.Text.StringBuilder();
        
        sb.AppendLine("# Agent Chat Tools Reference");
        sb.AppendLine();
        sb.AppendLine($"*Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC*");
        sb.AppendLine();
        sb.AppendLine($"Total tools: **{tools.Count}**");
        sb.AppendLine();
        
        // Group by category
        var categories = tools.GroupBy(t => t.Category ?? "uncategorized")
            .OrderBy(g => g.Key);
        
        sb.AppendLine("## Table of Contents");
        sb.AppendLine();
        foreach (var category in categories)
        {
            var categoryName = category.Key.Replace("_", " ");
            var anchor = category.Key.ToLower().Replace("_", "-");
            sb.AppendLine($"- [{categoryName}](#{anchor}) ({category.Count()} tools)");
        }
        sb.AppendLine();
        
        // Tool details by category
        foreach (var category in categories)
        {
            var categoryName = category.Key.Replace("_", " ");
            sb.AppendLine($"## {categoryName}");
            sb.AppendLine();
            
            foreach (var tool in category.OrderBy(t => t.Name))
            {
                var detail = MapToolToDetailDto(tool);
                
                sb.AppendLine($"### `{tool.Name}`");
                sb.AppendLine();
                sb.AppendLine($"**Risk Tier:** {tool.RiskTier}");
                sb.AppendLine();
                sb.AppendLine(tool.Description);
                sb.AppendLine();
                
                if (detail.Parameters.Any())
                {
                    sb.AppendLine("**Parameters:**");
                    sb.AppendLine();
                    sb.AppendLine("| Name | Type | Required | Description | Default |");
                    sb.AppendLine("|------|------|----------|-------------|---------|");
                    
                    foreach (var param in detail.Parameters)
                    {
                        var req = param.Required ? "Yes" : "No";
                        var desc = param.Description ?? "-";
                        var def = param.DefaultValue ?? "-";
                        if (param.EnumValues?.Any() == true)
                        {
                            desc += $" (Values: {string.Join(", ", param.EnumValues.Select(v => $"`{v}`"))})";
                        }
                        sb.AppendLine($"| `{param.Name}` | {param.Type} | {req} | {desc} | {def} |");
                    }
                    sb.AppendLine();
                }
                
                if (tool.Tags.Any())
                {
                    sb.AppendLine($"**Tags:** {string.Join(", ", tool.Tags.Select(t => $"`{t}`"))}");
                    sb.AppendLine();
                }
                
                if (detail.GitHubUrl != null)
                {
                    sb.AppendLine($"[View Source Code]({detail.GitHubUrl})");
                    sb.AppendLine();
                }
                
                sb.AppendLine("---");
                sb.AppendLine();
            }
        }
        
        return Results.Text(sb.ToString(), "text/markdown");
    }

    #region Mapping helpers

    private static ToolSummaryDto MapToolToDto(ToolDefinition tool) => new()
    {
        Name = tool.Name,
        Description = tool.Description,
        Category = tool.Category ?? "uncategorized",
        RiskTier = tool.RiskTier.ToString(),
        Tags = tool.Tags
    };

    private static ToolDetailDto MapToolToDetailDto(ToolDefinition tool)
    {
        // Parse the parameters schema to extract parameter details
        var parameters = new List<ToolParameterDto>();
        var requiredParams = new List<string>();

        if (tool.ParametersSchema.TryGetProperty("properties", out var props))
        {
            foreach (var prop in props.EnumerateObject())
            {
                var param = new ToolParameterDto
                {
                    Name = prop.Name,
                    Type = prop.Value.TryGetProperty("type", out var t) ? t.GetString() ?? "string" : "string",
                    Description = prop.Value.TryGetProperty("description", out var d) ? d.GetString() : null,
                    Required = false, // Will be set below
                    DefaultValue = prop.Value.TryGetProperty("default", out var def) ? def.ToString() : null,
                    EnumValues = prop.Value.TryGetProperty("enum", out var enumVals) 
                        ? enumVals.EnumerateArray().Select(e => e.GetString() ?? "").ToList() 
                        : null
                };
                parameters.Add(param);
            }
        }

        if (tool.ParametersSchema.TryGetProperty("required", out var required))
        {
            foreach (var r in required.EnumerateArray())
            {
                var paramName = r.GetString();
                if (paramName != null)
                {
                    requiredParams.Add(paramName);
                    var param = parameters.FirstOrDefault(p => p.Name == paramName);
                    if (param != null)
                        param.Required = true;
                }
            }
        }

        // Determine source file location for code navigation
        var sourceLocation = GetSourceLocation(tool.Name, tool.Category ?? "");

        return new ToolDetailDto
        {
            Name = tool.Name,
            Description = tool.Description,
            Category = tool.Category ?? "uncategorized",
            RiskTier = tool.RiskTier.ToString(),
            Tags = tool.Tags,
            Parameters = parameters,
            ParametersSchemaRaw = tool.ParametersSchema.ToString(),
            SourceFile = sourceLocation.File,
            SourceLine = sourceLocation.Line,
            GitHubUrl = sourceLocation.GitHubUrl
        };
    }

    private static (string? File, int? Line, string? GitHubUrl) GetSourceLocation(string toolName, string category)
    {
        // Map tools to their source files and line numbers
        const string baseGitHubUrl = "https://github.com/fxvarga/fvargas-portfolio/blob/main/backend/dotnet";

        // Tool name to file and line number mapping
        var toolMapping = new Dictionary<string, (string File, int Line)>
        {
            // DataLake Tools (AgentChat.FinanceDataLake/Tools/DataLakeTools.cs)
            ["datalake_gl_query"] = ("AgentChat.FinanceDataLake/Tools/DataLakeTools.cs", 11),
            ["datalake_fixed_asset_query"] = ("AgentChat.FinanceDataLake/Tools/DataLakeTools.cs", 119),
            ["datalake_lease_query"] = ("AgentChat.FinanceDataLake/Tools/DataLakeTools.cs", 229),
            ["datalake_intercompany_query"] = ("AgentChat.FinanceDataLake/Tools/DataLakeTools.cs", 338),
            ["datalake_fx_rate_query"] = ("AgentChat.FinanceDataLake/Tools/DataLakeTools.cs", 436),
            ["datalake_variance_analysis"] = ("AgentChat.FinanceDataLake/Tools/DataLakeTools.cs", 532),
            
            // Knowledge Base - Policy Tools
            ["kb_policy_search"] = ("AgentChat.FinanceKnowledge/Tools/PolicyTools.cs", 11),
            ["kb_policy_get"] = ("AgentChat.FinanceKnowledge/Tools/PolicyTools.cs", 97),
            ["kb_policy_check"] = ("AgentChat.FinanceKnowledge/Tools/PolicyTools.cs", 183),
            
            // Knowledge Base - Procedure Tools
            ["kb_procedure_search"] = ("AgentChat.FinanceKnowledge/Tools/ProcedureTools.cs", 11),
            ["kb_procedure_get"] = ("AgentChat.FinanceKnowledge/Tools/ProcedureTools.cs", 112),
            
            // Knowledge Base - Standard Tools
            ["kb_standard_search"] = ("AgentChat.FinanceKnowledge/Tools/StandardTools.cs", 11),
            ["kb_standard_get"] = ("AgentChat.FinanceKnowledge/Tools/StandardTools.cs", 87),
            
            // Knowledge Base - Recommendation Tools
            ["kb_treatment_recommendation"] = ("AgentChat.FinanceKnowledge/Tools/RecommendationTools.cs", 11),
            ["kb_list"] = ("AgentChat.FinanceKnowledge/Tools/RecommendationTools.cs", 137),
            
            // Excel Tools
            ["excel_template_search"] = ("AgentChat.Tools/FinanceTools/ExcelTools.cs", 13),
            ["excel_template_generate"] = ("AgentChat.Tools/FinanceTools/ExcelTools.cs", 96),
            ["excel_support_doc_create"] = ("AgentChat.Tools/FinanceTools/ExcelTools.cs", 460),
            
            // Built-in Tools
            ["web_search"] = ("AgentChat.Tools/BuiltInTools/BuiltInTools.cs", 10),
            ["file_write"] = ("AgentChat.Tools/BuiltInTools/BuiltInTools.cs", 77),
            ["code_execute"] = ("AgentChat.Tools/BuiltInTools/BuiltInTools.cs", 148),
            
            // Portfolio - Analysis Tools
            ["portfolio_analyze_freshness"] = ("AgentChat.PortfolioAgent/Tools/AnalysisTools.cs", 14),
            ["portfolio_analyze_seo"] = ("AgentChat.PortfolioAgent/Tools/AnalysisTools.cs", 179),
            ["portfolio_log_activity"] = ("AgentChat.PortfolioAgent/Tools/AnalysisTools.cs", 436),
            
            // Portfolio - Draft Tools
            ["portfolio_create_draft"] = ("AgentChat.PortfolioAgent/Tools/DraftTools.cs", 13),
            ["portfolio_queue_proposal"] = ("AgentChat.PortfolioAgent/Tools/DraftTools.cs", 146),
            ["portfolio_get_pending_reviews"] = ("AgentChat.PortfolioAgent/Tools/DraftTools.cs", 300),
            
            // Portfolio - Memory Tools
            ["portfolio_remember_fact"] = ("AgentChat.PortfolioAgent/Tools/MemoryTools.cs", 14),
            ["portfolio_recall_public_memories"] = ("AgentChat.PortfolioAgent/Tools/MemoryTools.cs", 139),
            ["portfolio_recall_all_memories"] = ("AgentChat.PortfolioAgent/Tools/MemoryTools.cs", 239),
            ["portfolio_log_decision"] = ("AgentChat.PortfolioAgent/Tools/MemoryTools.cs", 350),
            
            // Portfolio - Search Tools
            ["portfolio_search"] = ("AgentChat.PortfolioAgent/Tools/PortfolioSearchTools.cs", 12),
            ["portfolio_get_content"] = ("AgentChat.PortfolioAgent/Tools/PortfolioSearchTools.cs", 131),
            ["portfolio_suggestions"] = ("AgentChat.PortfolioAgent/Tools/PortfolioSearchTools.cs", 229),
        };

        // Try exact tool name match first
        if (toolMapping.TryGetValue(toolName, out var mapping))
        {
            return (mapping.File, mapping.Line, $"{baseGitHubUrl}/{mapping.File}#L{mapping.Line}");
        }

        // Fall back to category-based mapping without line numbers
        return category.ToLower() switch
        {
            "finance_datalake" or "datalake" => (
                "AgentChat.FinanceDataLake/Tools/DataLakeTools.cs",
                null,
                $"{baseGitHubUrl}/AgentChat.FinanceDataLake/Tools/DataLakeTools.cs"
            ),
            "finance_sor" => (
                "AgentChat.Tools/FinanceTools/SorApiTools.cs",
                null,
                $"{baseGitHubUrl}/AgentChat.Tools/FinanceTools/SorApiTools.cs"
            ),
            "knowledge_base" => (
                "AgentChat.FinanceKnowledge/Tools/PolicyTools.cs",
                null,
                $"{baseGitHubUrl}/AgentChat.FinanceKnowledge/Tools/PolicyTools.cs"
            ),
            "excel" => (
                "AgentChat.Tools/FinanceTools/ExcelTools.cs",
                null,
                $"{baseGitHubUrl}/AgentChat.Tools/FinanceTools/ExcelTools.cs"
            ),
            "portfolio" or "memory" or "analysis" or "content" or "activity" => (
                "AgentChat.PortfolioAgent/Tools/AnalysisTools.cs",
                null,
                $"{baseGitHubUrl}/AgentChat.PortfolioAgent/Tools/AnalysisTools.cs"
            ),
            "search" or "filesystem" or "code" => (
                "AgentChat.Tools/BuiltInTools/BuiltInTools.cs",
                null,
                $"{baseGitHubUrl}/AgentChat.Tools/BuiltInTools/BuiltInTools.cs"
            ),
            _ => (null, null, null)
        };
    }

    #endregion
}

#region DTOs

public class ToolListResponse
{
    public List<ToolSummaryDto> Tools { get; set; } = [];
    public int TotalCount { get; set; }
}

public class ToolSummaryDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string RiskTier { get; set; } = "";
    public List<string> Tags { get; set; } = [];
}

public class ToolDetailDto : ToolSummaryDto
{
    public List<ToolParameterDto> Parameters { get; set; } = [];
    public string? ParametersSchemaRaw { get; set; }
    public string? SourceFile { get; set; }
    public int? SourceLine { get; set; }
    public string? GitHubUrl { get; set; }
}

public class ToolParameterDto
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "string";
    public string? Description { get; set; }
    public bool Required { get; set; }
    public string? DefaultValue { get; set; }
    public List<string>? EnumValues { get; set; }
}

public class ToolCategoryDto
{
    public string Name { get; set; } = "";
    public int Count { get; set; }
    public Dictionary<string, int> RiskBreakdown { get; set; } = new();
}

#endregion
