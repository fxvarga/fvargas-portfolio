using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using AgentChat.FinanceKnowledge.Services;

namespace AgentChat.FinanceKnowledge.Tools;

/// <summary>
/// Tool for searching accounting standards (ASC/IFRS) in the knowledge base.
/// </summary>
public class StandardSearchTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public StandardSearchTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_standard_search",
        Description = "Search for accounting standards (US GAAP ASC or IFRS) in the knowledge base. " +
                      "Use to find standards related to specific accounting topics like leases, revenue, " +
                      "intangibles, or foreign currency. Returns matching standards with key information.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "keyword": {
                    "type": "string",
                    "description": "Search term to match in standard name, description, or codification"
                }
            }
        }
        """).RootElement,
        Tags = ["knowledge_base", "search", "standards", "gaap", "ifrs", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _knowledgeBase.InitializeAsync();

            string? keyword = args.TryGetProperty("keyword", out var kwEl) ? kwEl.GetString() : null;

            var standards = _knowledgeBase.SearchStandards(keyword);

            var results = standards.Select(s => new
            {
                id = s.Id,
                name = s.Name,
                codification = s.Codification,
                effective_date = s.EffectiveDate,
                ifrs_equivalent = s.IfrsEquivalent,
                description = s.Description?.Length > 200 
                    ? s.Description[..200] + "..." 
                    : s.Description
            }).ToList();

            var result = JsonSerializer.SerializeToElement(new
            {
                total_count = results.Count,
                standards = results
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error searching standards: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for retrieving a specific accounting standard with full details.
/// </summary>
public class StandardGetTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public StandardGetTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_standard_get",
        Description = "Get the full details of an accounting standard by its ID. " +
                      "Returns comprehensive information including key definitions, " +
                      "classification criteria, measurement guidance, disclosures, and common issues.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "standard_id": {
                    "type": "string",
                    "description": "The standard ID (e.g., ASC-842, ASC-606, ASC-350, ASC-830)"
                }
            },
            "required": ["standard_id"]
        }
        """).RootElement,
        Tags = ["knowledge_base", "standards", "gaap", "ifrs", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _knowledgeBase.InitializeAsync();

            var standardId = args.GetProperty("standard_id").GetString();
            if (string.IsNullOrEmpty(standardId))
            {
                return ToolExecutionResult.Fail("standard_id is required", DateTime.UtcNow - startTime);
            }

            var standard = _knowledgeBase.GetStandard(standardId);
            if (standard == null)
            {
                return ToolExecutionResult.Fail($"Standard '{standardId}' not found", DateTime.UtcNow - startTime);
            }

            // Return the full standard as serialized JSON
            // The YAML structure is flexible, so we serialize the whole object
            var result = JsonSerializer.SerializeToElement(new
            {
                id = standard.Id,
                name = standard.Name,
                codification = standard.Codification,
                effective_date = standard.EffectiveDate,
                description = standard.Description,
                ifrs_equivalent = standard.IfrsEquivalent,
                key_definitions = standard.KeyDefinitions,
                provisions = standard.Provisions,
                disclosures = standard.Disclosures,
                common_issues = standard.CommonIssues,
                related_standards = standard.RelatedStandards
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error retrieving standard: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}
