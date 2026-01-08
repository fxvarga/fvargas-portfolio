using YamlDotNet.Serialization;

namespace AgentChat.FinanceKnowledge.Models;

/// <summary>
/// Represents an internal company accounting policy
/// </summary>
public class CompanyPolicy
{
    [YamlMember(Alias = "id")]
    public string? Id { get; set; }
    
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
    
    [YamlMember(Alias = "version")]
    public string? Version { get; set; }
    
    [YamlMember(Alias = "effective_date")]
    public string? EffectiveDate { get; set; }
    
    [YamlMember(Alias = "owner")]
    public string? Owner { get; set; }
    
    [YamlMember(Alias = "approvers")]
    public List<string>? Approvers { get; set; }
    
    [YamlMember(Alias = "last_review_date")]
    public string? LastReviewDate { get; set; }
    
    [YamlMember(Alias = "next_review_date")]
    public string? NextReviewDate { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
    
    [YamlMember(Alias = "scope")]
    public PolicyScope? Scope { get; set; }
    
    [YamlMember(Alias = "capitalization_thresholds")]
    public Dictionary<string, object>? CapitalizationThresholds { get; set; }
    
    [YamlMember(Alias = "useful_lives")]
    public Dictionary<string, object>? UsefulLives { get; set; }
    
    [YamlMember(Alias = "depreciation_methods")]
    public Dictionary<string, object>? DepreciationMethods { get; set; }
    
    [YamlMember(Alias = "approval_matrix")]
    public Dictionary<string, object>? ApprovalMatrix { get; set; }
    
    [YamlMember(Alias = "close_calendar")]
    public Dictionary<string, object>? CloseCalendar { get; set; }
    
    [YamlMember(Alias = "thresholds")]
    public List<PolicyThreshold>? Thresholds { get; set; }
    
    [YamlMember(Alias = "related_standards")]
    public List<Dictionary<string, object>>? RelatedStandards { get; set; }
    
    [YamlMember(Alias = "related_procedures")]
    public List<Dictionary<string, object>>? RelatedProcedures { get; set; }
    
    /// <summary>
    /// Catch-all for additional YAML data
    /// </summary>
    [YamlMember(Alias = "additional_data")]
    public Dictionary<string, object>? AdditionalData { get; set; }
    
    [YamlMember(Alias = "tags")]
    public List<string>? Tags { get; set; }
}

public class PolicyScope
{
    [YamlMember(Alias = "entities")]
    public List<string>? Entities { get; set; }
    
    [YamlMember(Alias = "asset_classes")]
    public List<string>? AssetClasses { get; set; }
    
    [YamlMember(Alias = "close_types")]
    public List<string>? CloseTypes { get; set; }
    
    [YamlMember(Alias = "transaction_types")]
    public List<string>? TransactionTypes { get; set; }
}

public class PolicyThreshold
{
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
    
    [YamlMember(Alias = "amount")]
    public decimal Amount { get; set; }
    
    [YamlMember(Alias = "currency")]
    public string? Currency { get; set; }
    
    [YamlMember(Alias = "entities")]
    public List<string>? Entities { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
}

/// <summary>
/// Summary view of a policy for search results
/// </summary>
public class PolicySummary
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required string Owner { get; init; }
    public string? EffectiveDate { get; init; }
    public List<string>? Tags { get; init; }
}
