using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using AgentChat.FinanceKnowledge.Services;

namespace AgentChat.FinanceKnowledge.Tools;

/// <summary>
/// Tool for getting treatment recommendations based on knowledge base.
/// </summary>
public class TreatmentRecommendationTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public TreatmentRecommendationTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_treatment_recommendation",
        Description = "Get accounting treatment recommendation for a transaction based on " +
                      "applicable standards and company policies. Returns recommended procedures, " +
                      "relevant standards, and applicable policies with confidence level.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "transaction_type": {
                    "type": "string",
                    "description": "Type of transaction (e.g., depreciation, lease, revenue, intercompany, fx)"
                },
                "entity_code": {
                    "type": "string",
                    "description": "Legal entity code"
                },
                "amount": {
                    "type": "number",
                    "description": "Transaction amount for threshold evaluation"
                },
                "additional_context": {
                    "type": "object",
                    "description": "Additional context for recommendation (e.g., asset_class, contract_type)"
                }
            },
            "required": ["transaction_type", "entity_code"]
        }
        """).RootElement,
        Tags = ["knowledge_base", "recommendation", "treatment", "read-only"]
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

            var transactionType = args.GetProperty("transaction_type").GetString();
            var entityCode = args.GetProperty("entity_code").GetString();
            var amount = args.TryGetProperty("amount", out var amtEl) ? amtEl.GetDecimal() : 0m;

            if (string.IsNullOrEmpty(transactionType) || string.IsNullOrEmpty(entityCode))
            {
                return ToolExecutionResult.Fail("transaction_type and entity_code are required", DateTime.UtcNow - startTime);
            }

            Dictionary<string, object>? additionalContext = null;
            if (args.TryGetProperty("additional_context", out var ctxEl))
            {
                additionalContext = JsonSerializer.Deserialize<Dictionary<string, object>>(ctxEl.GetRawText());
            }

            var recommendation = _knowledgeBase.GetTreatmentRecommendation(
                transactionType, entityCode, amount, additionalContext);

            var result = JsonSerializer.SerializeToElement(new
            {
                transaction_type = recommendation.TransactionType,
                entity_code = recommendation.EntityCode,
                amount = recommendation.Amount,
                confidence = recommendation.Confidence.ToString().ToLower(),
                requires_manual_review = recommendation.RequiresManualReview,
                applicable_procedures = recommendation.ApplicableProcedures,
                applicable_standards = recommendation.ApplicableStandards,
                applicable_policies = recommendation.ApplicablePolicies,
                recommendation_summary = GenerateSummary(recommendation),
                timestamp = recommendation.Timestamp
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error getting treatment recommendation: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }

    private static string GenerateSummary(Models.TreatmentRecommendation recommendation)
    {
        var parts = new List<string>();

        if (recommendation.ApplicableProcedures.Any())
        {
            parts.Add($"Follow procedure(s): {string.Join(", ", recommendation.ApplicableProcedures)}");
        }

        if (recommendation.ApplicableStandards.Any())
        {
            parts.Add($"Refer to standard(s): {string.Join(", ", recommendation.ApplicableStandards)}");
        }

        if (recommendation.ApplicablePolicies.Any())
        {
            parts.Add($"Apply policy(ies): {string.Join(", ", recommendation.ApplicablePolicies)}");
        }

        if (recommendation.RequiresManualReview)
        {
            parts.Add("Manual review recommended due to low/medium confidence");
        }

        return parts.Any() ? string.Join(". ", parts) + "." : "No specific guidance found.";
    }
}

/// <summary>
/// Tool for listing all available knowledge base content.
/// </summary>
public class KnowledgeBaseListTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public KnowledgeBaseListTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_list",
        Description = "List all available content in the finance knowledge base. " +
                      "Returns summary counts and lists of all procedures, standards, and policies.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "content_type": {
                    "type": "string",
                    "description": "Filter by content type (optional)",
                    "enum": ["procedures", "standards", "policies"]
                }
            }
        }
        """).RootElement,
        Tags = ["knowledge_base", "list", "read-only"]
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

            string? contentType = args.TryGetProperty("content_type", out var ctEl) ? ctEl.GetString() : null;

            var resultData = new Dictionary<string, object>();

            if (string.IsNullOrEmpty(contentType) || contentType == "procedures")
            {
                var procedures = _knowledgeBase.GetAllProcedures();
                resultData["procedures"] = new
                {
                    count = procedures.Count(),
                    items = procedures.Select(p => new { id = p.Id, name = p.Name, category = p.Category })
                };
            }

            if (string.IsNullOrEmpty(contentType) || contentType == "standards")
            {
                var standards = _knowledgeBase.GetAllStandards();
                resultData["standards"] = new
                {
                    count = standards.Count(),
                    items = standards.Select(s => new { id = s.Id, name = s.Name, codification = s.Codification })
                };
            }

            if (string.IsNullOrEmpty(contentType) || contentType == "policies")
            {
                var policies = _knowledgeBase.GetAllPolicies();
                resultData["policies"] = new
                {
                    count = policies.Count(),
                    items = policies.Select(p => new { id = p.Id, name = p.Name, owner = p.Owner })
                };
            }

            var result = JsonSerializer.SerializeToElement(resultData);
            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error listing knowledge base: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}
