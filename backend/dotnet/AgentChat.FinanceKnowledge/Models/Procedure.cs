using YamlDotNet.Serialization;

namespace AgentChat.FinanceKnowledge.Models;

/// <summary>
/// Represents an accounting procedure that can be executed by the AI.
/// Procedures are defined in human-readable YAML and translated to tool calls.
/// </summary>
public class Procedure
{
    [YamlMember(Alias = "id")]
    public string? Id { get; set; }
    
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
    
    [YamlMember(Alias = "version")]
    public string? Version { get; set; } = "1.0";
    
    [YamlMember(Alias = "category")]
    public string? Category { get; set; }
    
    [YamlMember(Alias = "subcategory")]
    public string? Subcategory { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
    
    [YamlMember(Alias = "triggers")]
    public List<ProcedureTrigger>? Triggers { get; set; }
    
    [YamlMember(Alias = "scope")]
    public ProcedureScope? Scope { get; set; }
    
    [YamlMember(Alias = "inputs")]
    public List<ProcedureInput>? Inputs { get; set; }
    
    [YamlMember(Alias = "outputs")]
    public List<ProcedureOutput>? Outputs { get; set; }
    
    [YamlMember(Alias = "steps")]
    public List<ProcedureStep>? Steps { get; set; }
    
    [YamlMember(Alias = "exceptions")]
    public List<ProcedureException>? Exceptions { get; set; }
    
    [YamlMember(Alias = "related_standards")]
    public List<StandardReference>? RelatedStandards { get; set; }
    
    [YamlMember(Alias = "related_policies")]
    public List<PolicyReference>? RelatedPolicies { get; set; }
    
    [YamlMember(Alias = "audit_considerations")]
    public List<object>? AuditConsiderations { get; set; }
    
    [YamlMember(Alias = "tags")]
    public List<string>? Tags { get; set; }
}

/// <summary>
/// A single step in a procedure
/// </summary>
public class ProcedureStep
{
    [YamlMember(Alias = "step_number")]
    public int StepNumber { get; set; }
    
    [YamlMember(Alias = "action")]
    public string? Action { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
    
    [YamlMember(Alias = "tool")]
    public string? Tool { get; set; }
    
    [YamlMember(Alias = "parameters")]
    public Dictionary<string, object>? Parameters { get; set; }
    
    [YamlMember(Alias = "output_variable")]
    public string? OutputVariable { get; set; }
    
    [YamlMember(Alias = "condition")]
    public string? Condition { get; set; }
}

public class ProcedureTrigger
{
    [YamlMember(Alias = "type")]
    public string? Type { get; set; }
    
    [YamlMember(Alias = "frequency")]
    public string? Frequency { get; set; }
    
    [YamlMember(Alias = "timing")]
    public string? Timing { get; set; }
    
    [YamlMember(Alias = "event_name")]
    public string? EventName { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
}

public class ProcedureScope
{
    [YamlMember(Alias = "entities")]
    public List<string>? Entities { get; set; }
    
    [YamlMember(Alias = "account_ranges")]
    public List<AccountRange>? AccountRanges { get; set; }
    
    [YamlMember(Alias = "materiality_threshold")]
    public decimal? MaterialityThreshold { get; set; }
}

public class AccountRange
{
    [YamlMember(Alias = "start")]
    public string? Start { get; set; }
    
    [YamlMember(Alias = "end")]
    public string? End { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
}

public class ProcedureInput
{
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
    
    [YamlMember(Alias = "type")]
    public string? Type { get; set; }
    
    [YamlMember(Alias = "required")]
    public bool Required { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
}

public class ProcedureOutput
{
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
    
    [YamlMember(Alias = "type")]
    public string? Type { get; set; }
    
    [YamlMember(Alias = "description")]
    public string? Description { get; set; }
}

public class ProcedureException
{
    [YamlMember(Alias = "condition")]
    public string? Condition { get; set; }
    
    [YamlMember(Alias = "action")]
    public string? Action { get; set; }
    
    [YamlMember(Alias = "message")]
    public string? Message { get; set; }
}

public class StandardReference
{
    [YamlMember(Alias = "id")]
    public string? Id { get; set; }
    
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
    
    [YamlMember(Alias = "relevance")]
    public string? Relevance { get; set; }
    
    [YamlMember(Alias = "sections")]
    public List<string>? Sections { get; set; }
}

public class PolicyReference
{
    [YamlMember(Alias = "id")]
    public string? Id { get; set; }
    
    [YamlMember(Alias = "name")]
    public string? Name { get; set; }
}

/// <summary>
/// Summary view of a procedure for search results
/// </summary>
public class ProcedureSummary
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Category { get; init; }
    public string? Subcategory { get; init; }
    public required string Description { get; init; }
    public int StepCount { get; init; }
    public List<string>? Tags { get; init; }
}
