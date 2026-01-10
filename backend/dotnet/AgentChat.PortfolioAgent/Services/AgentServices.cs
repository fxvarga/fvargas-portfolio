using AgentChat.PortfolioAgent.Models;
using AgentChat.PortfolioAgent.Security;
using Microsoft.Extensions.Logging;

namespace AgentChat.PortfolioAgent.Services;

/// <summary>
/// Service for managing agent memories
/// </summary>
public interface IAgentMemoryService
{
    /// <summary>Store a new memory (with PII detection)</summary>
    Task<AgentMemory?> RememberAsync(Guid portfolioId, MemoryType type, string content, 
        MemoryClassification classification = MemoryClassification.Private,
        string? source = null, Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default);
    
    /// <summary>Recall memories by type and classification</summary>
    Task<IReadOnlyList<AgentMemory>> RecallAsync(Guid portfolioId, 
        MemoryClassification? maxClassification = null,
        MemoryType? type = null, int limit = 20,
        CancellationToken cancellationToken = default);
    
    /// <summary>Semantic search over memories</summary>
    Task<IReadOnlyList<AgentMemory>> SearchMemoriesAsync(Guid portfolioId, string query,
        MemoryClassification? maxClassification = null, int limit = 10,
        CancellationToken cancellationToken = default);
    
    /// <summary>Deactivate a memory</summary>
    Task<bool> ForgetAsync(Guid memoryId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for managing activity logs
/// </summary>
public interface IActivityLogService
{
    /// <summary>Log an activity</summary>
    Task<ActivityLogEntry> LogAsync(Guid portfolioId, ActivityType type, string summary,
        string? details = null, Dictionary<string, object>? data = null,
        bool isPublic = true, CancellationToken cancellationToken = default);
    
    /// <summary>Get recent activity</summary>
    Task<IReadOnlyList<ActivityLogEntry>> GetRecentActivityAsync(Guid portfolioId,
        bool publicOnly = true, int limit = 50,
        CancellationToken cancellationToken = default);
    
    /// <summary>Get daily summary</summary>
    Task<DailySummary> GetDailySummaryAsync(Guid portfolioId, DateTime date,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Service for managing drafts and proposals
/// </summary>
public interface IDraftService
{
    /// <summary>Create a new draft</summary>
    Task<ContentDraft> CreateDraftAsync(Guid portfolioId, DraftType type, 
        string title, string content, string? reasoning = null,
        CancellationToken cancellationToken = default);
    
    /// <summary>Get pending drafts</summary>
    Task<IReadOnlyList<ContentDraft>> GetPendingDraftsAsync(Guid portfolioId,
        CancellationToken cancellationToken = default);
    
    /// <summary>Update draft status</summary>
    Task<bool> UpdateDraftStatusAsync(Guid draftId, DraftStatus status, 
        string? reviewerNotes = null, CancellationToken cancellationToken = default);
    
    /// <summary>Queue a proposal</summary>
    Task<AgentProposal> QueueProposalAsync(Guid portfolioId, ProposalType type,
        string title, string description, string? reasoning = null,
        ProposalPriority priority = ProposalPriority.Medium,
        CancellationToken cancellationToken = default);
    
    /// <summary>Get pending proposals</summary>
    Task<IReadOnlyList<AgentProposal>> GetPendingProposalsAsync(Guid portfolioId,
        CancellationToken cancellationToken = default);
}

public record DailySummary
{
    public required DateTime Date { get; init; }
    public required int TasksCompleted { get; init; }
    public required int DraftsCreated { get; init; }
    public required int ProposalsQueued { get; init; }
    public required int VisitorConversations { get; init; }
    public required int MemoriesRecorded { get; init; }
    public required IReadOnlyList<string> Highlights { get; init; }
}

/// <summary>
/// In-memory implementation of agent memory service
/// For production, this would use PostgreSQL with pgvector
/// </summary>
public class InMemoryAgentMemoryService : IAgentMemoryService
{
    private readonly List<AgentMemory> _memories = new();
    private readonly IPiiDetector _piiDetector;
    private readonly ILogger<InMemoryAgentMemoryService> _logger;
    private readonly object _lock = new();

    public InMemoryAgentMemoryService(IPiiDetector piiDetector, ILogger<InMemoryAgentMemoryService> logger)
    {
        _piiDetector = piiDetector;
        _logger = logger;
    }

    public Task<AgentMemory?> RememberAsync(Guid portfolioId, MemoryType type, string content,
        MemoryClassification classification = MemoryClassification.Private,
        string? source = null, Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        // Check for PII
        var piiResult = _piiDetector.Detect(content);
        
        if (piiResult.ShouldBlock)
        {
            _logger.LogWarning("Blocked memory storage due to credential detection");
            return Task.FromResult<AgentMemory?>(null);
        }

        // Redact any PII found
        var sanitizedContent = piiResult.ContainsPii ? _piiDetector.Redact(content) : content;

        var memory = new AgentMemory
        {
            PortfolioId = portfolioId,
            Type = type,
            Classification = classification,
            Content = sanitizedContent,
            Source = source,
            Metadata = metadata ?? new(),
            ExpiresAt = GetExpirationDate(classification, type)
        };

        lock (_lock)
        {
            _memories.Add(memory);
        }

        _logger.LogInformation("Stored {Classification} memory of type {Type} for portfolio {PortfolioId}",
            classification, type, portfolioId);

        return Task.FromResult<AgentMemory?>(memory);
    }

    public Task<IReadOnlyList<AgentMemory>> RecallAsync(Guid portfolioId,
        MemoryClassification? maxClassification = null,
        MemoryType? type = null, int limit = 20,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var query = _memories
                .Where(m => m.PortfolioId == portfolioId)
                .Where(m => m.IsActive)
                .Where(m => m.ExpiresAt == null || m.ExpiresAt > DateTime.UtcNow);

            if (maxClassification.HasValue)
            {
                query = query.Where(m => m.Classification <= maxClassification.Value);
            }

            if (type.HasValue)
            {
                query = query.Where(m => m.Type == type.Value);
            }

            var result = query
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentMemory>>(result);
        }
    }

    public Task<IReadOnlyList<AgentMemory>> SearchMemoriesAsync(Guid portfolioId, string query,
        MemoryClassification? maxClassification = null, int limit = 10,
        CancellationToken cancellationToken = default)
    {
        // Simple text search for in-memory implementation
        // Production would use pgvector for semantic search
        var lowerQuery = query.ToLowerInvariant();
        
        lock (_lock)
        {
            var queryable = _memories
                .Where(m => m.PortfolioId == portfolioId)
                .Where(m => m.IsActive)
                .Where(m => m.ExpiresAt == null || m.ExpiresAt > DateTime.UtcNow)
                .Where(m => m.Content.ToLowerInvariant().Contains(lowerQuery));

            if (maxClassification.HasValue)
            {
                queryable = queryable.Where(m => m.Classification <= maxClassification.Value);
            }

            var result = queryable
                .OrderByDescending(m => m.CreatedAt)
                .Take(limit)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentMemory>>(result);
        }
    }

    public Task<bool> ForgetAsync(Guid memoryId, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var memory = _memories.FirstOrDefault(m => m.Id == memoryId);
            if (memory != null)
            {
                memory.IsActive = false;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }

    private static DateTime? GetExpirationDate(MemoryClassification classification, MemoryType type)
    {
        return type switch
        {
            MemoryType.VisitorInsight => DateTime.UtcNow.AddDays(30),
            MemoryType.VisitorSuggestion => DateTime.UtcNow.AddDays(90),
            MemoryType.ContentAnalysis => DateTime.UtcNow.AddDays(7),
            _ => classification switch
            {
                MemoryClassification.Public => null, // Portfolio facts don't expire
                MemoryClassification.Private => DateTime.UtcNow.AddDays(365),
                _ => DateTime.UtcNow.AddDays(30)
            }
        };
    }
}

/// <summary>
/// In-memory implementation of activity log service
/// </summary>
public class InMemoryActivityLogService : IActivityLogService
{
    private readonly List<ActivityLogEntry> _entries = new();
    private readonly object _lock = new();

    public Task<ActivityLogEntry> LogAsync(Guid portfolioId, ActivityType type, string summary,
        string? details = null, Dictionary<string, object>? data = null,
        bool isPublic = true, CancellationToken cancellationToken = default)
    {
        var entry = new ActivityLogEntry
        {
            PortfolioId = portfolioId,
            Type = type,
            Summary = summary,
            Details = details,
            Data = data ?? new(),
            IsPublic = isPublic
        };

        lock (_lock)
        {
            _entries.Add(entry);
        }

        return Task.FromResult(entry);
    }

    public Task<IReadOnlyList<ActivityLogEntry>> GetRecentActivityAsync(Guid portfolioId,
        bool publicOnly = true, int limit = 50,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var query = _entries
                .Where(e => e.PortfolioId == portfolioId);

            if (publicOnly)
            {
                query = query.Where(e => e.IsPublic);
            }

            var result = query
                .OrderByDescending(e => e.Timestamp)
                .Take(limit)
                .ToList();

            return Task.FromResult<IReadOnlyList<ActivityLogEntry>>(result);
        }
    }

    public Task<DailySummary> GetDailySummaryAsync(Guid portfolioId, DateTime date,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var dayStart = date.Date;
            var dayEnd = dayStart.AddDays(1);

            var dayEntries = _entries
                .Where(e => e.PortfolioId == portfolioId)
                .Where(e => e.Timestamp >= dayStart && e.Timestamp < dayEnd)
                .ToList();

            var summary = new DailySummary
            {
                Date = date.Date,
                TasksCompleted = dayEntries.Count(e => e.Type == ActivityType.TaskCompleted),
                DraftsCreated = dayEntries.Count(e => e.Type == ActivityType.DraftCreated),
                ProposalsQueued = dayEntries.Count(e => e.Type == ActivityType.ProposalQueued),
                VisitorConversations = dayEntries.Count(e => e.Type == ActivityType.VisitorConversation),
                MemoriesRecorded = dayEntries.Count(e => e.Type == ActivityType.LearningRecorded),
                Highlights = dayEntries
                    .Where(e => e.IsPublic)
                    .OrderByDescending(e => e.Timestamp)
                    .Take(5)
                    .Select(e => e.Summary)
                    .ToList()
            };

            return Task.FromResult(summary);
        }
    }
}

/// <summary>
/// In-memory implementation of draft service
/// </summary>
public class InMemoryDraftService : IDraftService
{
    private readonly List<ContentDraft> _drafts = new();
    private readonly List<AgentProposal> _proposals = new();
    private readonly object _lock = new();

    public Task<ContentDraft> CreateDraftAsync(Guid portfolioId, DraftType type,
        string title, string content, string? reasoning = null,
        CancellationToken cancellationToken = default)
    {
        var draft = new ContentDraft
        {
            PortfolioId = portfolioId,
            Type = type,
            Title = title,
            Content = content,
            Reasoning = reasoning,
            Slug = GenerateSlug(title)
        };

        lock (_lock)
        {
            _drafts.Add(draft);
        }

        return Task.FromResult(draft);
    }

    public Task<IReadOnlyList<ContentDraft>> GetPendingDraftsAsync(Guid portfolioId,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var result = _drafts
                .Where(d => d.PortfolioId == portfolioId)
                .Where(d => d.Status == DraftStatus.Pending)
                .OrderByDescending(d => d.CreatedAt)
                .ToList();

            return Task.FromResult<IReadOnlyList<ContentDraft>>(result);
        }
    }

    public Task<bool> UpdateDraftStatusAsync(Guid draftId, DraftStatus status,
        string? reviewerNotes = null, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var draft = _drafts.FirstOrDefault(d => d.Id == draftId);
            if (draft != null)
            {
                draft.Status = status;
                draft.ReviewedAt = DateTime.UtcNow;
                draft.ReviewerNotes = reviewerNotes;
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }
    }

    public Task<AgentProposal> QueueProposalAsync(Guid portfolioId, ProposalType type,
        string title, string description, string? reasoning = null,
        ProposalPriority priority = ProposalPriority.Medium,
        CancellationToken cancellationToken = default)
    {
        var proposal = new AgentProposal
        {
            PortfolioId = portfolioId,
            Type = type,
            Title = title,
            Description = description,
            Reasoning = reasoning,
            Priority = priority
        };

        lock (_lock)
        {
            _proposals.Add(proposal);
        }

        return Task.FromResult(proposal);
    }

    public Task<IReadOnlyList<AgentProposal>> GetPendingProposalsAsync(Guid portfolioId,
        CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var result = _proposals
                .Where(p => p.PortfolioId == portfolioId)
                .Where(p => p.Status == ProposalStatus.Pending)
                .OrderByDescending(p => p.Priority)
                .ThenByDescending(p => p.CreatedAt)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentProposal>>(result);
        }
    }

    private static string GenerateSlug(string title)
    {
        return title.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "");
    }
}
