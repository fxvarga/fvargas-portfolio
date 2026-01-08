using YamlDotNet.Serialization;

namespace AgentChat.FinanceKnowledge.Models;

/// <summary>
/// Represents an accounting standard (ASC or IFRS)
/// </summary>
public class AccountingStandard
{
    [YamlMember(Alias = "id")]
    public string? Id { get; set; }
    
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
    
    [YamlMember(Alias = "codification")]
    public string? Codification { get; set; }
    
    [YamlMember(Alias = "effective_date")]
    public string? EffectiveDate { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
    
    [YamlMember(Alias = "ifrs_equivalent")]
    public string? IfrsEquivalent { get; set; }
    
    [YamlMember(Alias = "key_definitions")]
    public Dictionary<string, object>? KeyDefinitions { get; set; }
    
    [YamlMember(Alias = "classification")]
    public Dictionary<string, object>? Classification { get; set; }
    
    [YamlMember(Alias = "measurement")]
    public Dictionary<string, object>? Measurement { get; set; }
    
    [YamlMember(Alias = "practical_expedients")]
    public Dictionary<string, object>? PracticalExpedients { get; set; }
    
    [YamlMember(Alias = "subsequent_measurement")]
    public Dictionary<string, object>? SubsequentMeasurement { get; set; }
    
    [YamlMember(Alias = "provisions")]
    public Dictionary<string, object>? Provisions { get; set; }
    
    [YamlMember(Alias = "disclosures")]
    public Dictionary<string, object>? Disclosures { get; set; }
    
    [YamlMember(Alias = "transition")]
    public Dictionary<string, object>? Transition { get; set; }
    
    [YamlMember(Alias = "common_issues")]
    public List<Dictionary<string, object>>? CommonIssues { get; set; }
    
    [YamlMember(Alias = "related_standards")]
    public List<Dictionary<string, object>>? RelatedStandards { get; set; }
    
    [YamlMember(Alias = "tags")]
    public List<string>? Tags { get; set; }
}

/// <summary>
/// Summary view of a standard for search results
/// </summary>
public class StandardSummary
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public string? Codification { get; init; }
    public required string Description { get; init; }
    public List<string>? Tags { get; init; }
}
