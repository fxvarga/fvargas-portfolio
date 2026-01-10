using AgentChat.PortfolioAgent.Security;

namespace AgentChat.PortfolioAgent.Models;

/// <summary>
/// A memory item stored by the agent
/// </summary>
public class AgentMemory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid PortfolioId { get; set; }
    public required MemoryClassification Classification { get; set; }
    public required MemoryType Type { get; set; }
    public required string Content { get; set; }
    public string? Source { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
    public float[]? Embedding { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public enum MemoryType
{
    /// <summary>Facts about the portfolio, projects, skills</summary>
    PortfolioFact,
    
    /// <summary>Insights from visitor conversations</summary>
    VisitorInsight,
    
    /// <summary>Decisions made by the agent with reasoning</summary>
    DecisionLog,
    
    /// <summary>Things the agent has learned</summary>
    Learning,
    
    /// <summary>Visitor suggestions/feedback</summary>
    VisitorSuggestion,
    
    /// <summary>Content analysis results</summary>
    ContentAnalysis
}

/// <summary>
/// Activity log entry - high-level summary of agent actions
/// </summary>
public class ActivityLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid PortfolioId { get; set; }
    public required ActivityType Type { get; set; }
    public required string Summary { get; set; }
    public string? Details { get; set; }
    public Dictionary<string, object> Data { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public bool IsPublic { get; set; } = true;
}

public enum ActivityType
{
    /// <summary>Agent started a task</summary>
    TaskStarted,
    
    /// <summary>Agent completed a task</summary>
    TaskCompleted,
    
    /// <summary>Agent searched for content</summary>
    SearchPerformed,
    
    /// <summary>Agent analyzed content</summary>
    ContentAnalyzed,
    
    /// <summary>Agent created a draft</summary>
    DraftCreated,
    
    /// <summary>Agent queued a proposal for owner</summary>
    ProposalQueued,
    
    /// <summary>Agent had a conversation with visitor</summary>
    VisitorConversation,
    
    /// <summary>Agent learned something new</summary>
    LearningRecorded,
    
    /// <summary>Agent made a decision</summary>
    DecisionMade
}

/// <summary>
/// A draft created by the agent awaiting owner approval
/// </summary>
public class ContentDraft
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid PortfolioId { get; set; }
    public required DraftType Type { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public string? Slug { get; set; }
    public string? Reasoning { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public DraftStatus Status { get; set; } = DraftStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewerNotes { get; set; }
}

public enum DraftType
{
    BlogPost,
    CaseStudy,
    ProjectUpdate,
    ContentRevision,
    SeoImprovement
}

public enum DraftStatus
{
    Pending,
    Approved,
    Rejected,
    NeedsRevision
}

/// <summary>
/// A proposal queued by the agent for owner review
/// </summary>
public class AgentProposal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid PortfolioId { get; set; }
    public required ProposalType Type { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string? Reasoning { get; set; }
    public Dictionary<string, object> ProposedChanges { get; set; } = new();
    public ProposalPriority Priority { get; set; } = ProposalPriority.Medium;
    public ProposalStatus Status { get; set; } = ProposalStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}

public enum ProposalType
{
    UpdateContent,
    CreateContent,
    ImprovesSeo,
    FixIssue,
    AddFeature,
    ResearchTopic
}

public enum ProposalPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum ProposalStatus
{
    Pending,
    Approved,
    Rejected,
    InProgress,
    Completed
}

/// <summary>
/// Content freshness analysis result
/// </summary>
public class FreshnessAnalysis
{
    public required string ContentId { get; set; }
    public required string ContentType { get; set; }
    public required string Title { get; set; }
    public required DateTime LastUpdated { get; set; }
    public required int DaysSinceUpdate { get; set; }
    public required FreshnessStatus Status { get; set; }
    public List<string> Recommendations { get; set; } = new();
    public List<string> OutdatedReferences { get; set; } = new();
}

public enum FreshnessStatus
{
    Fresh,      // Updated within 30 days
    Current,    // Updated within 90 days
    Aging,      // Updated within 180 days
    Stale,      // Updated within 365 days
    Outdated    // Over a year old
}

/// <summary>
/// SEO analysis result
/// </summary>
public class SeoAnalysis
{
    public required string ContentId { get; set; }
    public required string ContentType { get; set; }
    public required string Title { get; set; }
    public required int OverallScore { get; set; }
    public required SeoGrade Grade { get; set; }
    public List<SeoIssue> Issues { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
    public Dictionary<string, int> ComponentScores { get; set; } = new();
}

public enum SeoGrade
{
    A,
    B,
    C,
    D,
    F
}

public record SeoIssue
{
    public required string Category { get; init; }
    public required string Issue { get; init; }
    public required string Recommendation { get; init; }
    public required SeoIssueSeverity Severity { get; init; }
}

public enum SeoIssueSeverity
{
    Info,
    Warning,
    Error
}
