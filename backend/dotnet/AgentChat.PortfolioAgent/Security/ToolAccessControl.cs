namespace AgentChat.PortfolioAgent.Security;

/// <summary>
/// Defines who is interacting with the agent
/// </summary>
public enum CallerType
{
    /// <summary>Anonymous visitor to the portfolio</summary>
    Visitor,
    
    /// <summary>Autonomous background agent</summary>
    Autonomous,
    
    /// <summary>Authenticated portfolio owner</summary>
    Owner
}

/// <summary>
/// Classification of memory items
/// </summary>
public enum MemoryClassification
{
    /// <summary>Visible to everyone (portfolio facts, projects, skills)</summary>
    Public,
    
    /// <summary>Owner-only (drafts, strategies, analytics)</summary>
    Private,
    
    /// <summary>Never stored (PII, credentials, secrets)</summary>
    Sensitive
}

/// <summary>
/// Context for tool execution with security information
/// </summary>
public class PortfolioToolContext
{
    public required CallerType CallerType { get; init; }
    public required Guid PortfolioId { get; init; }
    public required string PortfolioSlug { get; init; }
    public string? VisitorSessionId { get; init; }
    public Guid? UserId { get; init; }
    public bool IsAuthenticated => UserId.HasValue;
}

/// <summary>
/// Tool access control - defines which tools are available to which caller types
/// </summary>
public static class ToolAccessControl
{
    /// <summary>
    /// Tools available to anonymous visitors (read-only)
    /// </summary>
    public static readonly HashSet<string> VisitorAllowedTools = new()
    {
        "portfolio_search",
        "portfolio_get_content",
        "portfolio_get_project",
        "portfolio_get_blog_post",
        "portfolio_recall_public_memories",
        "portfolio_explain_project"
    };

    /// <summary>
    /// Tools available to autonomous agent (includes drafts but no direct publish)
    /// </summary>
    public static readonly HashSet<string> AutonomousAllowedTools = new()
    {
        // All visitor tools
        "portfolio_search",
        "portfolio_get_content",
        "portfolio_get_project",
        "portfolio_get_blog_post",
        "portfolio_recall_public_memories",
        "portfolio_explain_project",
        
        // Analysis tools
        "portfolio_analyze_freshness",
        "portfolio_analyze_seo",
        
        // Draft tools (never publish directly)
        "portfolio_create_draft",
        "portfolio_update_draft",
        "portfolio_queue_proposal",
        
        // Memory tools
        "portfolio_remember_fact",
        "portfolio_recall_all_memories",
        "portfolio_log_decision",
        
        // Activity logging
        "portfolio_log_activity"
    };

    /// <summary>
    /// Tools available to authenticated owner (full access)
    /// </summary>
    public static readonly HashSet<string> OwnerAllowedTools = new()
    {
        // All autonomous tools
        "portfolio_search",
        "portfolio_get_content",
        "portfolio_get_project",
        "portfolio_get_blog_post",
        "portfolio_recall_public_memories",
        "portfolio_explain_project",
        "portfolio_analyze_freshness",
        "portfolio_analyze_seo",
        "portfolio_create_draft",
        "portfolio_update_draft",
        "portfolio_queue_proposal",
        "portfolio_remember_fact",
        "portfolio_recall_all_memories",
        "portfolio_log_decision",
        "portfolio_log_activity",
        
        // Owner-only tools
        "portfolio_publish_content",
        "portfolio_delete_content",
        "portfolio_manage_memories",
        "portfolio_configure_agent"
    };

    public static bool IsToolAllowed(string toolName, CallerType callerType)
    {
        return callerType switch
        {
            CallerType.Visitor => VisitorAllowedTools.Contains(toolName),
            CallerType.Autonomous => AutonomousAllowedTools.Contains(toolName),
            CallerType.Owner => OwnerAllowedTools.Contains(toolName),
            _ => false
        };
    }

    public static IReadOnlySet<string> GetAllowedTools(CallerType callerType)
    {
        return callerType switch
        {
            CallerType.Visitor => VisitorAllowedTools,
            CallerType.Autonomous => AutonomousAllowedTools,
            CallerType.Owner => OwnerAllowedTools,
            _ => new HashSet<string>()
        };
    }
}
