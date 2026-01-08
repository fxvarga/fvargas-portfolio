using System.Text.Json;

namespace AgentChat.Shared.Models;

/// <summary>
/// Definition of a tool that can be called by the LLM
/// </summary>
public class ToolDefinition
{
    public required string Name { get; init; }
    public required string Description { get; init; }
    public string Category { get; init; } = "general";
    
    /// <summary>
    /// JSON Schema for argument validation
    /// </summary>
    public required JsonElement ParametersSchema { get; init; }
    
    /// <summary>
    /// Risk classification - higher risk tools require approval
    /// </summary>
    public RiskTier RiskTier { get; init; } = RiskTier.Low;
    
    /// <summary>
    /// Maximum execution time
    /// </summary>
    public TimeSpan Timeout { get; init; } = TimeSpan.FromSeconds(30);
    
    /// <summary>
    /// Retry policy for transient failures
    /// </summary>
    public RetryPolicy RetryPolicy { get; init; } = new();
    
    /// <summary>
    /// Whether this tool can produce artifacts
    /// </summary>
    public bool CanProduceArtifacts { get; init; }
    
    /// <summary>
    /// Allowed artifact types if CanProduceArtifacts is true
    /// </summary>
    public string[] AllowedArtifactTypes { get; init; } = Array.Empty<string>();
    
    /// <summary>
    /// Rate limiting: max calls per minute (null = unlimited)
    /// </summary>
    public int? MaxCallsPerMinute { get; init; }
    
    /// <summary>
    /// Rate limiting: max calls per run (null = unlimited)
    /// </summary>
    public int? MaxCallsPerRun { get; init; }
    
    /// <summary>
    /// Tags for categorization
    /// </summary>
    public List<string> Tags { get; init; } = new();
}

/// <summary>
/// Retry policy configuration
/// </summary>
public class RetryPolicy
{
    public int MaxRetries { get; init; } = 3;
    public TimeSpan InitialBackoff { get; init; } = TimeSpan.FromSeconds(1);
    public double BackoffMultiplier { get; init; } = 2.0;
    public TimeSpan MaxBackoff { get; init; } = TimeSpan.FromSeconds(30);
}
