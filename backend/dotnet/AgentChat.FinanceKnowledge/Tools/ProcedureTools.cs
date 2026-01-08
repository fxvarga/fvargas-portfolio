using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using AgentChat.FinanceKnowledge.Services;

namespace AgentChat.FinanceKnowledge.Tools;

/// <summary>
/// Tool for searching accounting procedures in the knowledge base.
/// </summary>
public class ProcedureSearchTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public ProcedureSearchTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_procedure_search",
        Description = "Search for accounting procedures in the finance knowledge base. " +
                      "Use to find procedures by category (close, reconciliation, journal_entry, revenue), " +
                      "subcategory, or keyword. Returns a list of matching procedures with their IDs and descriptions.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Procedure category: close, reconciliation, journal_entry, revenue",
                    "enum": ["close", "reconciliation", "journal_entry", "revenue"]
                },
                "subcategory": {
                    "type": "string",
                    "description": "Specific subcategory within the category"
                },
                "keyword": {
                    "type": "string",
                    "description": "Search term to match in procedure name, description, or ID"
                },
                "entity_code": {
                    "type": "string",
                    "description": "Filter procedures applicable to a specific entity"
                }
            }
        }
        """).RootElement,
        Tags = ["knowledge_base", "search", "procedures", "read-only"]
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

            string? category = args.TryGetProperty("category", out var catEl) ? catEl.GetString() : null;
            string? subcategory = args.TryGetProperty("subcategory", out var subEl) ? subEl.GetString() : null;
            string? keyword = args.TryGetProperty("keyword", out var kwEl) ? kwEl.GetString() : null;
            string? entityCode = args.TryGetProperty("entity_code", out var entEl) ? entEl.GetString() : null;

            var procedures = string.IsNullOrEmpty(entityCode)
                ? _knowledgeBase.SearchProcedures(category, subcategory, keyword)
                : _knowledgeBase.GetProceduresForEntity(entityCode)
                    .Where(p => 
                        (string.IsNullOrEmpty(category) || p.Category?.Equals(category, StringComparison.OrdinalIgnoreCase) == true) &&
                        (string.IsNullOrEmpty(subcategory) || p.Subcategory?.Equals(subcategory, StringComparison.OrdinalIgnoreCase) == true) &&
                        (string.IsNullOrEmpty(keyword) || 
                         (p.Name?.Contains(keyword, StringComparison.OrdinalIgnoreCase) == true) ||
                         (p.Description?.Contains(keyword, StringComparison.OrdinalIgnoreCase) == true)));

            var results = procedures.Select(p => new
            {
                id = p.Id,
                name = p.Name,
                category = p.Category,
                subcategory = p.Subcategory,
                description = p.Description?.Length > 200 
                    ? p.Description[..200] + "..." 
                    : p.Description,
                step_count = p.Steps?.Count ?? 0,
                triggers = p.Triggers?.Select(t => t.Type).ToList()
            }).ToList();

            var result = JsonSerializer.SerializeToElement(new
            {
                total_count = results.Count,
                procedures = results
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error searching procedures: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for retrieving a specific procedure with full details.
/// </summary>
public class ProcedureGetTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public ProcedureGetTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_procedure_get",
        Description = "Get the full details of an accounting procedure by its ID. " +
                      "Returns complete procedure information including all steps, parameters, " +
                      "triggers, exceptions, and related standards/policies.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "procedure_id": {
                    "type": "string",
                    "description": "The procedure ID (e.g., PROC-CLOSE-001)"
                }
            },
            "required": ["procedure_id"]
        }
        """).RootElement,
        Tags = ["knowledge_base", "procedures", "read-only"]
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

            var procedureId = args.GetProperty("procedure_id").GetString();
            if (string.IsNullOrEmpty(procedureId))
            {
                return ToolExecutionResult.Fail("procedure_id is required", DateTime.UtcNow - startTime);
            }

            var procedure = _knowledgeBase.GetProcedure(procedureId);
            if (procedure == null)
            {
                return ToolExecutionResult.Fail($"Procedure '{procedureId}' not found", DateTime.UtcNow - startTime);
            }

            var result = JsonSerializer.SerializeToElement(new
            {
                id = procedure.Id,
                name = procedure.Name,
                version = procedure.Version,
                category = procedure.Category,
                subcategory = procedure.Subcategory,
                description = procedure.Description,
                triggers = procedure.Triggers?.Select(t => new
                {
                    type = t.Type,
                    frequency = t.Frequency,
                    timing = t.Timing,
                    event_name = t.EventName,
                    description = t.Description
                }),
                scope = new
                {
                    entities = procedure.Scope?.Entities,
                    account_ranges = procedure.Scope?.AccountRanges,
                    materiality_threshold = procedure.Scope?.MaterialityThreshold
                },
                inputs = procedure.Inputs?.Select(i => new
                {
                    name = i.Name,
                    type = i.Type,
                    required = i.Required,
                    description = i.Description
                }),
                outputs = procedure.Outputs?.Select(o => new
                {
                    name = o.Name,
                    type = o.Type,
                    description = o.Description
                }),
                steps = procedure.Steps?.Select(s => new
                {
                    step_number = s.StepNumber,
                    action = s.Action,
                    description = s.Description,
                    tool = s.Tool,
                    parameters = s.Parameters,
                    output_variable = s.OutputVariable,
                    condition = s.Condition
                }),
                exceptions = procedure.Exceptions?.Select(e => new
                {
                    condition = e.Condition,
                    action = e.Action,
                    message = e.Message
                }),
                related_standards = procedure.RelatedStandards,
                related_policies = procedure.RelatedPolicies
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error retrieving procedure: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}
