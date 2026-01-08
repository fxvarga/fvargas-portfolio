namespace AgentChat.FinanceKnowledge.Models;

/// <summary>
/// Treatment recommendation returned by the knowledge base
/// </summary>
public class TreatmentRecommendation
{
    public string? TransactionType { get; set; }
    public string? EntityCode { get; set; }
    public decimal Amount { get; set; }
    public DateTime Timestamp { get; set; }
    
    /// <summary>
    /// Related procedures that could be used
    /// </summary>
    public List<string> ApplicableProcedures { get; set; } = [];
    
    /// <summary>
    /// Relevant accounting standards
    /// </summary>
    public List<string> ApplicableStandards { get; set; } = [];
    
    /// <summary>
    /// Relevant company policies
    /// </summary>
    public List<string> ApplicablePolicies { get; set; } = [];
    
    /// <summary>
    /// Confidence level of the recommendation
    /// </summary>
    public ConfidenceLevel Confidence { get; set; }
    
    /// <summary>
    /// Whether manual review is required
    /// </summary>
    public bool RequiresManualReview { get; set; }
    
    /// <summary>
    /// Any caveats or considerations
    /// </summary>
    public List<string> Caveats { get; set; } = [];
}

public enum ConfidenceLevel
{
    High,
    Medium,
    Low,
    RequiresReview
}

/// <summary>
/// Represents a mapping from a procedure step to one or more tool calls
/// </summary>
public class ToolMapping
{
    public required string StepAction { get; init; }
    public required string ToolName { get; init; }
    public Dictionary<string, string> ParameterMapping { get; init; } = new();
    public string? TransformExpression { get; init; }
}
