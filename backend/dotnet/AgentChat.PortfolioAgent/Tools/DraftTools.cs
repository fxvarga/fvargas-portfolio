using System.Text.Json;
using AgentChat.PortfolioAgent.Models;
using AgentChat.PortfolioAgent.Services;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using Microsoft.Extensions.Logging;

namespace AgentChat.PortfolioAgent.Tools;

/// <summary>
/// Create a content draft (never publishes directly)
/// </summary>
public class CreateDraftTool : ITool
{
    private readonly IDraftService _draftService;
    private readonly IActivityLogService _activityLog;
    private readonly ILogger<CreateDraftTool> _logger;

    public CreateDraftTool(
        IDraftService draftService,
        IActivityLogService activityLog,
        ILogger<CreateDraftTool> logger)
    {
        _draftService = draftService;
        _activityLog = activityLog;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_create_draft",
        Description = "Create a content draft. Drafts are NEVER published directly - they require owner approval. Use this to propose new blog posts, case studies, or content updates.",
        Category = "content",
        RiskTier = RiskTier.Medium, // Requires approval
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["blog_post", "case_study", "project_update", "content_revision", "seo_improvement"],
                    "description": "Type of content being drafted"
                },
                "title": {
                    "type": "string",
                    "description": "Title of the content"
                },
                "content": {
                    "type": "string",
                    "description": "The draft content (markdown supported)"
                },
                "reasoning": {
                    "type": "string",
                    "description": "Explain why this content is being created/suggested"
                }
            },
            "required": ["type", "title", "content", "reasoning"]
        }
        """).RootElement,
        Tags = ["content", "draft", "autonomous-allowed", "requires-approval"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var typeStr = args.GetProperty("type").GetString();
            var title = args.GetProperty("title").GetString();
            var content = args.GetProperty("content").GetString();
            var reasoning = args.GetProperty("reasoning").GetString();

            if (string.IsNullOrEmpty(typeStr) || string.IsNullOrEmpty(title) || 
                string.IsNullOrEmpty(content) || string.IsNullOrEmpty(reasoning))
            {
                return ToolExecutionResult.Fail("Type, title, content, and reasoning are required", DateTime.UtcNow - startTime);
            }

            var draftType = ParseDraftType(typeStr);

            _logger.LogInformation("Creating {Type} draft: '{Title}'", draftType, title);

            var draft = await _draftService.CreateDraftAsync(
                context.TenantId,
                draftType,
                title,
                content,
                reasoning,
                cancellationToken);

            // Log activity
            await _activityLog.LogAsync(
                context.TenantId,
                ActivityType.DraftCreated,
                $"Created draft: {title}",
                $"Type: {draftType}, awaiting owner review",
                isPublic: true,
                cancellationToken: cancellationToken);

            var response = new
            {
                success = true,
                draftId = draft.Id,
                status = "pending",
                message = "Draft created and queued for owner approval",
                draft = new
                {
                    id = draft.Id,
                    type = draft.Type.ToString(),
                    title = draft.Title,
                    slug = draft.Slug,
                    createdAt = draft.CreatedAt
                }
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Create draft failed");
            return ToolExecutionResult.Fail($"Failed to create draft: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }

    private static DraftType ParseDraftType(string type)
    {
        return type.ToLowerInvariant().Replace("_", "") switch
        {
            "blogpost" => DraftType.BlogPost,
            "casestudy" => DraftType.CaseStudy,
            "projectupdate" => DraftType.ProjectUpdate,
            "contentrevision" => DraftType.ContentRevision,
            "seoimprovement" => DraftType.SeoImprovement,
            _ => DraftType.ContentRevision
        };
    }
}

/// <summary>
/// Queue a proposal for owner review
/// </summary>
public class QueueProposalTool : ITool
{
    private readonly IDraftService _draftService;
    private readonly IActivityLogService _activityLog;
    private readonly ILogger<QueueProposalTool> _logger;

    public QueueProposalTool(
        IDraftService draftService,
        IActivityLogService activityLog,
        ILogger<QueueProposalTool> logger)
    {
        _draftService = draftService;
        _activityLog = activityLog;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_queue_proposal",
        Description = "Queue a proposal or suggestion for owner review. Use this when you have an idea but don't want to create a full draft yet.",
        Category = "content",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["update_content", "create_content", "improve_seo", "fix_issue", "add_feature", "research_topic"],
                    "description": "Type of proposal"
                },
                "title": {
                    "type": "string",
                    "description": "Brief title for the proposal"
                },
                "description": {
                    "type": "string",
                    "description": "Detailed description of what you're proposing"
                },
                "reasoning": {
                    "type": "string",
                    "description": "Why you think this is a good idea"
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"],
                    "description": "Priority level of the proposal",
                    "default": "medium"
                }
            },
            "required": ["type", "title", "description"]
        }
        """).RootElement,
        Tags = ["content", "proposal", "autonomous-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var typeStr = args.GetProperty("type").GetString();
            var title = args.GetProperty("title").GetString();
            var description = args.GetProperty("description").GetString();

            if (string.IsNullOrEmpty(typeStr) || string.IsNullOrEmpty(title) || string.IsNullOrEmpty(description))
            {
                return ToolExecutionResult.Fail("Type, title, and description are required", DateTime.UtcNow - startTime);
            }

            var proposalType = ParseProposalType(typeStr);
            var reasoning = args.TryGetProperty("reasoning", out var reasonEl) ? reasonEl.GetString() : null;
            var priority = args.TryGetProperty("priority", out var prioEl) 
                ? ParsePriority(prioEl.GetString()) 
                : ProposalPriority.Medium;

            _logger.LogInformation("Queuing {Priority} proposal: '{Title}'", priority, title);

            var proposal = await _draftService.QueueProposalAsync(
                context.TenantId,
                proposalType,
                title,
                description,
                reasoning,
                priority,
                cancellationToken);

            // Log activity
            await _activityLog.LogAsync(
                context.TenantId,
                ActivityType.ProposalQueued,
                $"Proposed: {title}",
                $"Priority: {priority}",
                isPublic: true,
                cancellationToken: cancellationToken);

            var response = new
            {
                success = true,
                proposalId = proposal.Id,
                status = "pending",
                message = "Proposal queued for owner review",
                proposal = new
                {
                    id = proposal.Id,
                    type = proposal.Type.ToString(),
                    title = proposal.Title,
                    priority = proposal.Priority.ToString(),
                    createdAt = proposal.CreatedAt
                }
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Queue proposal failed");
            return ToolExecutionResult.Fail($"Failed to queue proposal: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }

    private static ProposalType ParseProposalType(string type)
    {
        return type.ToLowerInvariant().Replace("_", "") switch
        {
            "updatecontent" => ProposalType.UpdateContent,
            "createcontent" => ProposalType.CreateContent,
            "improveseo" => ProposalType.ImprovesSeo,
            "fixissue" => ProposalType.FixIssue,
            "addfeature" => ProposalType.AddFeature,
            "researchtopic" => ProposalType.ResearchTopic,
            _ => ProposalType.UpdateContent
        };
    }

    private static ProposalPriority ParsePriority(string? priority)
    {
        return priority?.ToLowerInvariant() switch
        {
            "low" => ProposalPriority.Low,
            "high" => ProposalPriority.High,
            "urgent" => ProposalPriority.Urgent,
            _ => ProposalPriority.Medium
        };
    }
}

/// <summary>
/// Get pending drafts and proposals (owner-only)
/// </summary>
public class GetPendingReviewsTool : ITool
{
    private readonly IDraftService _draftService;
    private readonly ILogger<GetPendingReviewsTool> _logger;

    public GetPendingReviewsTool(IDraftService draftService, ILogger<GetPendingReviewsTool> logger)
    {
        _draftService = draftService;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_get_pending_reviews",
        Description = "Get all pending drafts and proposals awaiting owner review.",
        Category = "content",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["drafts", "proposals", "all"],
                    "description": "What type of pending items to retrieve",
                    "default": "all"
                }
            }
        }
        """).RootElement,
        Tags = ["content", "review", "owner-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var type = args.TryGetProperty("type", out var typeEl) ? typeEl.GetString() : "all";

            var drafts = new List<ContentDraft>();
            var proposals = new List<AgentProposal>();

            if (type == "all" || type == "drafts")
            {
                drafts = (await _draftService.GetPendingDraftsAsync(context.TenantId, cancellationToken)).ToList();
            }

            if (type == "all" || type == "proposals")
            {
                proposals = (await _draftService.GetPendingProposalsAsync(context.TenantId, cancellationToken)).ToList();
            }

            var response = new
            {
                totalPending = drafts.Count + proposals.Count,
                drafts = drafts.Select(d => new
                {
                    id = d.Id,
                    type = d.Type.ToString(),
                    title = d.Title,
                    slug = d.Slug,
                    reasoning = d.Reasoning,
                    createdAt = d.CreatedAt,
                    contentPreview = d.Content.Length > 200 ? d.Content[..200] + "..." : d.Content
                }),
                proposals = proposals.Select(p => new
                {
                    id = p.Id,
                    type = p.Type.ToString(),
                    title = p.Title,
                    description = p.Description,
                    reasoning = p.Reasoning,
                    priority = p.Priority.ToString(),
                    createdAt = p.CreatedAt
                })
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Get pending reviews failed");
            return ToolExecutionResult.Fail($"Failed to get pending reviews: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}
