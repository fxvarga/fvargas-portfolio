using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using AgentChat.FinanceKnowledge.Services;

namespace AgentChat.FinanceKnowledge.Tools;

/// <summary>
/// Tool for searching company policies in the knowledge base.
/// </summary>
public class PolicySearchTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public PolicySearchTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_policy_search",
        Description = "Search for company accounting policies in the knowledge base. " +
                      "Use to find policies related to capitalization, depreciation, intercompany, " +
                      "close calendar, or other accounting topics.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "keyword": {
                    "type": "string",
                    "description": "Search term to match in policy name, description, or ID"
                },
                "entity_code": {
                    "type": "string",
                    "description": "Filter policies applicable to a specific entity"
                }
            }
        }
        """).RootElement,
        Tags = ["knowledge_base", "search", "policies", "read-only"]
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
            string? entityCode = args.TryGetProperty("entity_code", out var entEl) ? entEl.GetString() : null;

            var policies = string.IsNullOrEmpty(entityCode)
                ? _knowledgeBase.SearchPolicies(keyword)
                : _knowledgeBase.GetPoliciesForEntity(entityCode)
                    .Where(p => string.IsNullOrEmpty(keyword) || 
                           (p.Name?.Contains(keyword, StringComparison.OrdinalIgnoreCase) == true) ||
                           (p.Description?.Contains(keyword, StringComparison.OrdinalIgnoreCase) == true));

            var results = policies.Select(p => new
            {
                id = p.Id,
                name = p.Name,
                version = p.Version,
                effective_date = p.EffectiveDate,
                owner = p.Owner,
                description = p.Description?.Length > 200 
                    ? p.Description[..200] + "..." 
                    : p.Description
            }).ToList();

            var result = JsonSerializer.SerializeToElement(new
            {
                total_count = results.Count,
                policies = results
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error searching policies: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for retrieving a specific company policy with full details.
/// </summary>
public class PolicyGetTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public PolicyGetTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_policy_get",
        Description = "Get the full details of a company policy by its ID. " +
                      "Returns complete policy information including thresholds, " +
                      "approval requirements, useful lives, and related procedures.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "policy_id": {
                    "type": "string",
                    "description": "The policy ID (e.g., POL-CAP-001, POL-DEP-001)"
                }
            },
            "required": ["policy_id"]
        }
        """).RootElement,
        Tags = ["knowledge_base", "policies", "read-only"]
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

            var policyId = args.GetProperty("policy_id").GetString();
            if (string.IsNullOrEmpty(policyId))
            {
                return ToolExecutionResult.Fail("policy_id is required", DateTime.UtcNow - startTime);
            }

            var policy = _knowledgeBase.GetPolicy(policyId);
            if (policy == null)
            {
                return ToolExecutionResult.Fail($"Policy '{policyId}' not found", DateTime.UtcNow - startTime);
            }

            var result = JsonSerializer.SerializeToElement(new
            {
                id = policy.Id,
                name = policy.Name,
                version = policy.Version,
                effective_date = policy.EffectiveDate,
                owner = policy.Owner,
                approvers = policy.Approvers,
                last_review_date = policy.LastReviewDate,
                next_review_date = policy.NextReviewDate,
                description = policy.Description,
                scope = policy.Scope,
                thresholds = policy.Thresholds,
                approval_matrix = policy.ApprovalMatrix,
                related_standards = policy.RelatedStandards,
                related_procedures = policy.RelatedProcedures,
                additional_data = policy.AdditionalData
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error retrieving policy: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for checking policy thresholds and requirements.
/// </summary>
public class PolicyCheckTool : ITool
{
    private readonly IKnowledgeBaseService _knowledgeBase;

    public PolicyCheckTool(IKnowledgeBaseService knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    public ToolDefinition Definition => new()
    {
        Name = "kb_policy_check",
        Description = "Check if a transaction meets policy thresholds or requirements. " +
                      "Use for capitalization threshold checks, approval requirements, " +
                      "or other policy-based validations.",
        Category = "knowledge_base",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "check_type": {
                    "type": "string",
                    "description": "Type of check to perform",
                    "enum": ["capitalization", "approval", "depreciation_life"]
                },
                "entity_code": {
                    "type": "string",
                    "description": "Entity code for entity-specific thresholds"
                },
                "amount": {
                    "type": "number",
                    "description": "Amount to check against thresholds"
                },
                "asset_class": {
                    "type": "string",
                    "description": "Asset class for depreciation life lookup"
                }
            },
            "required": ["check_type", "entity_code"]
        }
        """).RootElement,
        Tags = ["knowledge_base", "policies", "validation", "read-only"]
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

            var checkType = args.GetProperty("check_type").GetString();
            var entityCode = args.GetProperty("entity_code").GetString();

            if (string.IsNullOrEmpty(checkType) || string.IsNullOrEmpty(entityCode))
            {
                return ToolExecutionResult.Fail("check_type and entity_code are required", DateTime.UtcNow - startTime);
            }

            object resultData = checkType switch
            {
                "capitalization" => HandleCapitalizationCheck(args, entityCode),
                "approval" => HandleApprovalCheck(args, entityCode),
                "depreciation_life" => HandleDepreciationLifeCheck(args),
                _ => throw new ArgumentException($"Unknown check type: {checkType}")
            };

            var result = JsonSerializer.SerializeToElement(resultData);
            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error checking policy: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }

    private object HandleCapitalizationCheck(JsonElement args, string entityCode)
    {
        if (!args.TryGetProperty("amount", out var amountEl))
        {
            throw new ArgumentException("amount is required for capitalization check");
        }

        var amount = amountEl.GetDecimal();
        var checkResult = _knowledgeBase.CheckCapitalizationThreshold(entityCode, amount);

        return new
        {
            check_type = "capitalization",
            entity_code = entityCode,
            amount,
            meets_threshold = checkResult.MeetsThreshold,
            threshold = checkResult.Threshold,
            currency = checkResult.Currency,
            recommendation = checkResult.MeetsThreshold ? "CAPITALIZE" : "EXPENSE",
            message = checkResult.Message,
            policy_id = checkResult.PolicyId
        };
    }

    private object HandleApprovalCheck(JsonElement args, string entityCode)
    {
        if (!args.TryGetProperty("amount", out var amountEl))
        {
            throw new ArgumentException("amount is required for approval check");
        }

        var amount = amountEl.GetDecimal();
        var policy = _knowledgeBase.GetPolicy("POL-CAP-001");

        // Default approval tiers if policy not found
        string approvalTier;
        List<string> requiredApprovers;
        int slaDays;

        if (amount <= 25000)
        {
            approvalTier = "Tier 1";
            requiredApprovers = new List<string> { "department_manager", "plant_controller" };
            slaDays = 3;
        }
        else if (amount <= 100000)
        {
            approvalTier = "Tier 2";
            requiredApprovers = new List<string> { "department_manager", "plant_controller", "regional_controller" };
            slaDays = 5;
        }
        else if (amount <= 500000)
        {
            approvalTier = "Tier 3";
            requiredApprovers = new List<string> { "department_director", "regional_controller", "corporate_controller" };
            slaDays = 10;
        }
        else
        {
            approvalTier = "Tier 4";
            requiredApprovers = new List<string> { "department_vp", "cfo", "board_capex_committee" };
            slaDays = 30;
        }

        return new
        {
            check_type = "approval",
            entity_code = entityCode,
            amount,
            approval_tier = approvalTier,
            required_approvers = requiredApprovers,
            sla_days = slaDays,
            policy_id = "POL-CAP-001"
        };
    }

    private object HandleDepreciationLifeCheck(JsonElement args)
    {
        if (!args.TryGetProperty("asset_class", out var assetClassEl))
        {
            throw new ArgumentException("asset_class is required for depreciation life check");
        }

        var assetClass = assetClassEl.GetString()?.ToLowerInvariant();

        // Default useful lives based on depreciation policy
        var (lifeYears, method, residualPercent) = assetClass switch
        {
            "buildings" => (40, "straight_line", 10m),
            "building_improvements" => (15, "straight_line", 0m),
            "machinery_and_equipment" or "machinery" or "equipment" => (10, "straight_line", 5m),
            "furniture_and_fixtures" or "furniture" => (7, "straight_line", 0m),
            "vehicles" => (5, "straight_line", 15m),
            "computer_hardware" or "computers" or "hardware" => (3, "straight_line", 0m),
            "leasehold_improvements" => (0, "straight_line", 0m), // Lesser of life or lease term
            _ => (5, "straight_line", 0m) // Default
        };

        return new
        {
            check_type = "depreciation_life",
            asset_class = assetClass,
            useful_life_years = lifeYears,
            depreciation_method = method,
            residual_value_percent = residualPercent,
            note = assetClass == "leasehold_improvements" 
                ? "Use lesser of useful life or remaining lease term" 
                : null,
            policy_id = "POL-DEP-001"
        };
    }
}
