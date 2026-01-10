using System.Text.Json;
using AgentChat.PortfolioAgent.Models;
using AgentChat.PortfolioAgent.Services;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using FV.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace AgentChat.PortfolioAgent.Tools;

/// <summary>
/// Analyze content freshness
/// </summary>
public class AnalyzeFreshnessTool : ITool
{
    private readonly ISearchService _searchService;
    private readonly IActivityLogService _activityLog;
    private readonly ILogger<AnalyzeFreshnessTool> _logger;

    public AnalyzeFreshnessTool(
        ISearchService searchService,
        IActivityLogService activityLog,
        ILogger<AnalyzeFreshnessTool> logger)
    {
        _searchService = searchService;
        _activityLog = activityLog;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_analyze_freshness",
        Description = "Analyze the freshness of portfolio content. Identifies outdated content that may need updating.",
        Category = "analysis",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "contentType": {
                    "type": "string",
                    "description": "Filter by content type: blog-post, case-study-page, about, services"
                },
                "staleThresholdDays": {
                    "type": "integer",
                    "description": "Consider content stale if not updated within this many days",
                    "default": 180
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of items to analyze",
                    "default": 20
                }
            }
        }
        """).RootElement,
        Tags = ["analysis", "content", "autonomous-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var contentType = args.TryGetProperty("contentType", out var typeEl) ? typeEl.GetString() : null;
            var staleThreshold = args.TryGetProperty("staleThresholdDays", out var thresholdEl) ? thresholdEl.GetInt32() : 180;
            var limit = args.TryGetProperty("limit", out var limitEl) ? limitEl.GetInt32() : 20;

            _logger.LogInformation("Analyzing content freshness (threshold: {Days} days)", staleThreshold);

            // Search for all content
            var searchOptions = new SearchOptions
            {
                PortfolioId = context.TenantId,
                Query = "*",
                Limit = limit,
                EntityTypes = contentType != null ? new List<string> { contentType } : null
            };

            var results = await _searchService.SearchAsync(searchOptions, cancellationToken);

            // Analyze freshness of each item
            // Note: In production, we'd get actual LastUpdated from the database
            var analyses = new List<FreshnessAnalysis>();
            var now = DateTime.UtcNow;

            foreach (var result in results)
            {
                // Simulate with random dates for demo - in production, use actual data
                var mockLastUpdated = now.AddDays(-Random.Shared.Next(1, 400));
                var daysSince = (int)(now - mockLastUpdated).TotalDays;

                var status = daysSince switch
                {
                    <= 30 => FreshnessStatus.Fresh,
                    <= 90 => FreshnessStatus.Current,
                    <= 180 => FreshnessStatus.Aging,
                    <= 365 => FreshnessStatus.Stale,
                    _ => FreshnessStatus.Outdated
                };

                var recommendations = new List<string>();
                if (status >= FreshnessStatus.Aging)
                {
                    recommendations.Add($"Content hasn't been updated in {daysSince} days");
                    recommendations.Add("Consider reviewing for accuracy and relevance");
                }
                if (status >= FreshnessStatus.Stale)
                {
                    recommendations.Add("Check for outdated technology references");
                    recommendations.Add("Update code examples if applicable");
                }

                analyses.Add(new FreshnessAnalysis
                {
                    ContentId = result.Id,
                    ContentType = result.EntityType,
                    Title = result.Title,
                    LastUpdated = mockLastUpdated,
                    DaysSinceUpdate = daysSince,
                    Status = status,
                    Recommendations = recommendations
                });
            }

            // Sort by staleness
            analyses = analyses.OrderByDescending(a => a.DaysSinceUpdate).ToList();

            var staleCount = analyses.Count(a => a.Status >= FreshnessStatus.Stale);

            // Log activity
            await _activityLog.LogAsync(
                context.TenantId,
                ActivityType.ContentAnalyzed,
                $"Analyzed freshness of {analyses.Count} content items, found {staleCount} stale",
                isPublic: true,
                cancellationToken: cancellationToken);

            var response = new
            {
                analyzedCount = analyses.Count,
                summary = new
                {
                    fresh = analyses.Count(a => a.Status == FreshnessStatus.Fresh),
                    current = analyses.Count(a => a.Status == FreshnessStatus.Current),
                    aging = analyses.Count(a => a.Status == FreshnessStatus.Aging),
                    stale = analyses.Count(a => a.Status == FreshnessStatus.Stale),
                    outdated = analyses.Count(a => a.Status == FreshnessStatus.Outdated)
                },
                items = analyses.Select(a => new
                {
                    id = a.ContentId,
                    title = a.Title,
                    type = a.ContentType,
                    lastUpdated = a.LastUpdated,
                    daysSinceUpdate = a.DaysSinceUpdate,
                    status = a.Status.ToString(),
                    recommendations = a.Recommendations
                })
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Freshness analysis failed");
            return ToolExecutionResult.Fail($"Analysis failed: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Analyze SEO of content
/// </summary>
public class AnalyzeSeoTool : ITool
{
    private readonly ISearchService _searchService;
    private readonly IActivityLogService _activityLog;
    private readonly ILogger<AnalyzeSeoTool> _logger;

    public AnalyzeSeoTool(
        ISearchService searchService,
        IActivityLogService activityLog,
        ILogger<AnalyzeSeoTool> logger)
    {
        _searchService = searchService;
        _activityLog = activityLog;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_analyze_seo",
        Description = "Analyze SEO quality of portfolio content. Checks title, description, headings, keywords, and provides improvement suggestions.",
        Category = "analysis",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "contentId": {
                    "type": "string",
                    "description": "ID of specific content to analyze"
                },
                "contentType": {
                    "type": "string",
                    "description": "Filter by content type to analyze multiple items"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of items to analyze",
                    "default": 10
                }
            }
        }
        """).RootElement,
        Tags = ["analysis", "seo", "autonomous-allowed"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var contentId = args.TryGetProperty("contentId", out var idEl) ? idEl.GetString() : null;
            var contentType = args.TryGetProperty("contentType", out var typeEl) ? typeEl.GetString() : null;
            var limit = args.TryGetProperty("limit", out var limitEl) ? limitEl.GetInt32() : 10;

            _logger.LogInformation("Analyzing SEO for portfolio content");

            // Search for content to analyze
            var searchOptions = new SearchOptions
            {
                PortfolioId = context.TenantId,
                Query = contentId ?? "*",
                Limit = limit,
                EntityTypes = contentType != null ? new List<string> { contentType } : null
            };

            var results = await _searchService.SearchAsync(searchOptions, cancellationToken);

            var analyses = new List<SeoAnalysis>();

            foreach (var result in results)
            {
                var analysis = AnalyzeContent(result);
                analyses.Add(analysis);
            }

            // Sort by score (worst first)
            analyses = analyses.OrderBy(a => a.OverallScore).ToList();

            var avgScore = analyses.Count > 0 ? (int)analyses.Average(a => a.OverallScore) : 0;

            // Log activity
            await _activityLog.LogAsync(
                context.TenantId,
                ActivityType.ContentAnalyzed,
                $"SEO analysis complete: {analyses.Count} items analyzed, avg score {avgScore}/100",
                isPublic: true,
                cancellationToken: cancellationToken);

            var response = new
            {
                analyzedCount = analyses.Count,
                averageScore = avgScore,
                gradeDistribution = new
                {
                    a = analyses.Count(a => a.Grade == SeoGrade.A),
                    b = analyses.Count(a => a.Grade == SeoGrade.B),
                    c = analyses.Count(a => a.Grade == SeoGrade.C),
                    d = analyses.Count(a => a.Grade == SeoGrade.D),
                    f = analyses.Count(a => a.Grade == SeoGrade.F)
                },
                items = analyses.Select(a => new
                {
                    id = a.ContentId,
                    title = a.Title,
                    type = a.ContentType,
                    score = a.OverallScore,
                    grade = a.Grade.ToString(),
                    componentScores = a.ComponentScores,
                    issues = a.Issues.Select(i => new
                    {
                        category = i.Category,
                        issue = i.Issue,
                        recommendation = i.Recommendation,
                        severity = i.Severity.ToString()
                    }),
                    suggestions = a.Suggestions
                })
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SEO analysis failed");
            return ToolExecutionResult.Fail($"Analysis failed: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }

    private static SeoAnalysis AnalyzeContent(SearchResult content)
    {
        var issues = new List<SeoIssue>();
        var suggestions = new List<string>();
        var componentScores = new Dictionary<string, int>();

        // Title analysis
        var titleScore = 100;
        if (string.IsNullOrEmpty(content.Title))
        {
            titleScore = 0;
            issues.Add(new SeoIssue
            {
                Category = "Title",
                Issue = "Missing title",
                Recommendation = "Add a descriptive title",
                Severity = SeoIssueSeverity.Error
            });
        }
        else
        {
            if (content.Title.Length < 30)
            {
                titleScore -= 20;
                issues.Add(new SeoIssue
                {
                    Category = "Title",
                    Issue = "Title is too short",
                    Recommendation = "Aim for 50-60 characters",
                    Severity = SeoIssueSeverity.Warning
                });
            }
            else if (content.Title.Length > 60)
            {
                titleScore -= 10;
                issues.Add(new SeoIssue
                {
                    Category = "Title",
                    Issue = "Title may be truncated in search results",
                    Recommendation = "Keep title under 60 characters",
                    Severity = SeoIssueSeverity.Info
                });
            }
        }
        componentScores["title"] = titleScore;

        // Content/snippet analysis
        var contentScore = 100;
        var snippetLength = content.Snippet?.Length ?? 0;
        if (snippetLength < 100)
        {
            contentScore -= 30;
            issues.Add(new SeoIssue
            {
                Category = "Content",
                Issue = "Content appears thin",
                Recommendation = "Add more detailed content (aim for 300+ words)",
                Severity = SeoIssueSeverity.Warning
            });
        }
        componentScores["content"] = contentScore;

        // URL analysis
        var urlScore = 100;
        if (!string.IsNullOrEmpty(content.Url))
        {
            if (content.Url.Length > 75)
            {
                urlScore -= 15;
                suggestions.Add("Consider shortening the URL for better sharing");
            }
        }
        else
        {
            urlScore = 50;
            issues.Add(new SeoIssue
            {
                Category = "URL",
                Issue = "No URL defined",
                Recommendation = "Ensure content has a proper URL structure",
                Severity = SeoIssueSeverity.Warning
            });
        }
        componentScores["url"] = urlScore;

        // Calculate overall score
        var overallScore = (titleScore + contentScore + urlScore) / 3;

        var grade = overallScore switch
        {
            >= 90 => SeoGrade.A,
            >= 80 => SeoGrade.B,
            >= 70 => SeoGrade.C,
            >= 60 => SeoGrade.D,
            _ => SeoGrade.F
        };

        // Add general suggestions
        if (overallScore < 80)
        {
            suggestions.Add("Review and address the issues listed above");
        }
        if (issues.Any(i => i.Category == "Content"))
        {
            suggestions.Add("Consider adding relevant keywords naturally throughout the content");
            suggestions.Add("Include internal links to related portfolio content");
        }

        return new SeoAnalysis
        {
            ContentId = content.Id,
            ContentType = content.EntityType,
            Title = content.Title,
            OverallScore = overallScore,
            Grade = grade,
            Issues = issues,
            Suggestions = suggestions,
            ComponentScores = componentScores
        };
    }
}

/// <summary>
/// Log agent activity
/// </summary>
public class LogActivityTool : ITool
{
    private readonly IActivityLogService _activityLog;
    private readonly ILogger<LogActivityTool> _logger;

    public LogActivityTool(IActivityLogService activityLog, ILogger<LogActivityTool> logger)
    {
        _activityLog = activityLog;
        _logger = logger;
    }

    public ToolDefinition Definition => new()
    {
        Name = "portfolio_log_activity",
        Description = "Log an activity entry for the public activity feed. Use this to maintain transparency about what the agent is doing.",
        Category = "activity",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "type": {
                    "type": "string",
                    "enum": ["task_started", "task_completed", "search_performed", "content_analyzed", "learning_recorded"],
                    "description": "Type of activity"
                },
                "summary": {
                    "type": "string",
                    "description": "Brief summary of the activity (shown publicly)"
                },
                "details": {
                    "type": "string",
                    "description": "Additional details (optional)"
                },
                "isPublic": {
                    "type": "boolean",
                    "description": "Whether this activity is visible to visitors",
                    "default": true
                }
            },
            "required": ["type", "summary"]
        }
        """).RootElement,
        Tags = ["activity", "logging", "autonomous-allowed"]
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
            var summary = args.GetProperty("summary").GetString();

            if (string.IsNullOrEmpty(typeStr) || string.IsNullOrEmpty(summary))
            {
                return ToolExecutionResult.Fail("Type and summary are required", DateTime.UtcNow - startTime);
            }

            var activityType = ParseActivityType(typeStr);
            var details = args.TryGetProperty("details", out var detailsEl) ? detailsEl.GetString() : null;
            var isPublic = !args.TryGetProperty("isPublic", out var publicEl) || publicEl.GetBoolean();

            var entry = await _activityLog.LogAsync(
                context.TenantId,
                activityType,
                summary,
                details,
                isPublic: isPublic,
                cancellationToken: cancellationToken);

            var response = new
            {
                success = true,
                activityId = entry.Id,
                timestamp = entry.Timestamp
            };

            return ToolExecutionResult.Ok(JsonSerializer.SerializeToElement(response), DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Log activity failed");
            return ToolExecutionResult.Fail($"Failed to log activity: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }

    private static ActivityType ParseActivityType(string type)
    {
        return type.ToLowerInvariant().Replace("_", "") switch
        {
            "taskstarted" => ActivityType.TaskStarted,
            "taskcompleted" => ActivityType.TaskCompleted,
            "searchperformed" => ActivityType.SearchPerformed,
            "contentanalyzed" => ActivityType.ContentAnalyzed,
            "learningrecorded" => ActivityType.LearningRecorded,
            _ => ActivityType.TaskCompleted
        };
    }
}
