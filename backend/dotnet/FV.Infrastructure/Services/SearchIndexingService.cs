using System.Text.Json;
using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FV.Infrastructure.Services;

/// <summary>
/// Configuration for the search indexing service
/// </summary>
public class SearchIndexingOptions
{
    /// <summary>
    /// Interval between indexing runs (default: 5 minutes)
    /// </summary>
    public TimeSpan IndexingInterval { get; set; } = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Whether to run an initial index on startup
    /// </summary>
    public bool IndexOnStartup { get; set; } = true;

    /// <summary>
    /// Entity types that should be indexed for search
    /// </summary>
    public List<string> IndexableEntityTypes { get; set; } = new()
    {
        "case-study-page",
        "hero",
        "about",
        "experience",
        "skills",
        "services",
        "contact"
    };
}

/// <summary>
/// Background service that periodically indexes content for search
/// </summary>
public class SearchIndexingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchIndexingService> _logger;
    private readonly SearchIndexingOptions _options;

    public SearchIndexingService(
        IServiceProvider serviceProvider,
        ISearchService searchService,
        ILogger<SearchIndexingService> logger,
        SearchIndexingOptions? options = null)
    {
        _serviceProvider = serviceProvider;
        _searchService = searchService;
        _logger = logger;
        _options = options ?? new SearchIndexingOptions();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Search Indexing Service starting. Interval: {Interval}", _options.IndexingInterval);

        // Wait for Elasticsearch to be ready
        await WaitForElasticsearchAsync(stoppingToken);

        // Run initial index if configured
        if (_options.IndexOnStartup)
        {
            _logger.LogInformation("Running initial search index");
            await RunIndexingAsync(stoppingToken);
        }

        // Periodic indexing loop
        using var timer = new PeriodicTimer(_options.IndexingInterval);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await timer.WaitForNextTickAsync(stoppingToken);
                await RunIndexingAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during search indexing");
            }
        }

        _logger.LogInformation("Search Indexing Service stopping");
    }

    private async Task WaitForElasticsearchAsync(CancellationToken cancellationToken)
    {
        const int maxAttempts = 30;
        const int delaySeconds = 2;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                if (await _searchService.IsHealthyAsync(cancellationToken))
                {
                    _logger.LogInformation("Elasticsearch is healthy and ready");
                    return;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Elasticsearch health check attempt {Attempt}/{MaxAttempts} failed", attempt, maxAttempts);
            }

            await Task.Delay(TimeSpan.FromSeconds(delaySeconds), cancellationToken);
        }

        _logger.LogWarning("Elasticsearch not available after {MaxAttempts} attempts. Indexing will retry on next interval.", maxAttempts);
    }

    /// <summary>
    /// Run the indexing process for all portfolios
    /// </summary>
    public async Task RunIndexingAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting search indexing run");
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CmsDbContext>();

            // Get all active portfolios
            var portfolios = await dbContext.Portfolios
                .Where(p => p.IsActive)
                .ToListAsync(cancellationToken);

            _logger.LogInformation("Found {Count} active portfolios to index", portfolios.Count);

            var totalDocuments = 0;
            foreach (var portfolio in portfolios)
            {
                var count = await IndexPortfolioAsync(dbContext, portfolio, cancellationToken);
                totalDocuments += count;
            }

            stopwatch.Stop();
            _logger.LogInformation("Search indexing completed. Indexed {TotalDocuments} documents in {ElapsedMs}ms",
                totalDocuments, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during search indexing run");
            throw;
        }
    }

    private async Task<int> IndexPortfolioAsync(CmsDbContext dbContext, Portfolio portfolio, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Indexing portfolio: {PortfolioSlug} ({PortfolioId})", portfolio.Slug, portfolio.Id);

        // Ensure index exists
        await _searchService.InitializeIndexAsync(portfolio.Id, portfolio.Slug, cancellationToken);

        // Get all published entity records for indexable types
        var records = await dbContext.EntityRecords
            .Where(r => r.PortfolioId == portfolio.Id)
            .Where(r => !r.IsDraft)
            .Where(r => _options.IndexableEntityTypes.Contains(r.EntityType))
            .ToListAsync(cancellationToken);

        _logger.LogDebug("Found {Count} published records for portfolio {PortfolioSlug}", records.Count, portfolio.Slug);

        // Convert to search documents
        var documents = new List<SearchDocument>();
        foreach (var record in records)
        {
            try
            {
                var docs = ExtractSearchDocuments(record, portfolio);
                documents.AddRange(docs);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract search documents from record {RecordId} ({EntityType})",
                    record.Id, record.EntityType);
            }
        }

        // Bulk index
        if (documents.Count > 0)
        {
            await _searchService.IndexDocumentsAsync(documents, cancellationToken);
            _logger.LogInformation("Indexed {Count} documents for portfolio {PortfolioSlug}",
                documents.Count, portfolio.Slug);
        }

        return documents.Count;
    }

    /// <summary>
    /// Extract search documents from an entity record
    /// </summary>
    private List<SearchDocument> ExtractSearchDocuments(EntityRecord record, Portfolio portfolio)
    {
        var documents = new List<SearchDocument>();
        var jsonData = JsonDocument.Parse(record.JsonData);
        var root = jsonData.RootElement;

        var url = GetUrlForEntity(record.EntityType, root, portfolio.Slug);
        var title = ExtractTitle(record.EntityType, root);

        switch (record.EntityType)
        {
            case "case-study-page":
                documents.AddRange(ExtractCaseStudyDocuments(record, portfolio, root, url, title));
                break;

            case "services":
                documents.AddRange(ExtractServicesDocuments(record, portfolio, root, url, title));
                break;

            case "hero":
            case "about":
            case "experience":
            case "skills":
            case "contact":
                documents.Add(ExtractSingletonDocument(record, portfolio, root, url, title));
                break;

            default:
                // Generic extraction for unknown types
                documents.Add(ExtractGenericDocument(record, portfolio, root, url, title));
                break;
        }

        return documents;
    }

    /// <summary>
    /// Extract documents from a case study page (which has sections)
    /// </summary>
    private List<SearchDocument> ExtractCaseStudyDocuments(
        EntityRecord record, Portfolio portfolio, JsonElement root, string url, string title)
    {
        var documents = new List<SearchDocument>();
        var baseDocId = $"{portfolio.Id:N}_{record.EntityType}_{record.Id:N}";

        // Main case study document
        var mainContent = new List<string>();

        // Extract description/subtitle
        if (root.TryGetProperty("subtitle", out var subtitle))
            mainContent.Add(subtitle.GetString() ?? "");
        if (root.TryGetProperty("description", out var description))
            mainContent.Add(description.GetString() ?? "");

        documents.Add(new SearchDocument
        {
            Id = $"{baseDocId}_main",
            PortfolioId = portfolio.Id,
            PortfolioSlug = portfolio.Slug,
            EntityType = record.EntityType,
            EntityId = record.Id,
            Title = title,
            Content = string.Join(" ", mainContent.Where(s => !string.IsNullOrWhiteSpace(s))),
            Url = url,
            Section = null,
            UpdatedAt = record.UpdatedAt
        });

        // Extract sections if present
        if (root.TryGetProperty("sections", out var sections) && sections.ValueKind == JsonValueKind.Array)
        {
            var sectionIndex = 0;
            foreach (var section in sections.EnumerateArray())
            {
                var sectionTitle = title;
                var sectionContent = new List<string>();

                // Try to get section heading/title
                if (section.TryGetProperty("heading", out var heading))
                {
                    var headingText = heading.GetString();
                    if (!string.IsNullOrWhiteSpace(headingText))
                    {
                        sectionTitle = $"{title} - {headingText}";
                        sectionContent.Add(headingText);
                    }
                }

                // Extract text content from section
                ExtractTextFromElement(section, sectionContent);

                if (sectionContent.Count > 0)
                {
                    documents.Add(new SearchDocument
                    {
                        Id = $"{baseDocId}_section_{sectionIndex}",
                        PortfolioId = portfolio.Id,
                        PortfolioSlug = portfolio.Slug,
                        EntityType = record.EntityType,
                        EntityId = record.Id,
                        Title = sectionTitle,
                        Content = string.Join(" ", sectionContent.Where(s => !string.IsNullOrWhiteSpace(s))),
                        Url = url,
                        Section = $"section-{sectionIndex}",
                        UpdatedAt = record.UpdatedAt
                    });
                }

                sectionIndex++;
            }
        }

        return documents;
    }

    /// <summary>
    /// Extract documents from services (which has an array of service items)
    /// </summary>
    private List<SearchDocument> ExtractServicesDocuments(
        EntityRecord record, Portfolio portfolio, JsonElement root, string url, string title)
    {
        var documents = new List<SearchDocument>();
        var baseDocId = $"{portfolio.Id:N}_{record.EntityType}_{record.Id:N}";

        // Main services document with section title
        var mainContent = new List<string>();
        if (root.TryGetProperty("title", out var sectionTitle))
            mainContent.Add(sectionTitle.GetString() ?? "");
        if (root.TryGetProperty("label", out var label))
            mainContent.Add(label.GetString() ?? "");

        documents.Add(new SearchDocument
        {
            Id = $"{baseDocId}_main",
            PortfolioId = portfolio.Id,
            PortfolioSlug = portfolio.Slug,
            EntityType = record.EntityType,
            EntityId = record.Id,
            Title = title,
            Content = string.Join(" ", mainContent.Where(s => !string.IsNullOrWhiteSpace(s))),
            Url = url,
            Section = null,
            UpdatedAt = record.UpdatedAt
        });

        // Extract individual service items
        if (root.TryGetProperty("services", out var services) && services.ValueKind == JsonValueKind.Array)
        {
            var serviceIndex = 0;
            foreach (var service in services.EnumerateArray())
            {
                var serviceTitle = title;
                var serviceContent = new List<string>();
                string? serviceSlug = null;

                // Get service slug for URL
                if (service.TryGetProperty("slug", out var slugProp))
                {
                    serviceSlug = slugProp.GetString();
                }

                // Get service title
                if (service.TryGetProperty("title", out var serviceTitleProp))
                {
                    var serviceTitleText = serviceTitleProp.GetString();
                    if (!string.IsNullOrWhiteSpace(serviceTitleText))
                    {
                        serviceTitle = serviceTitleText;
                        serviceContent.Add(serviceTitleText);

                        // Generate slug from title if not provided (matches frontend generateSlug logic)
                        if (string.IsNullOrWhiteSpace(serviceSlug))
                        {
                            serviceSlug = GenerateSlug(serviceTitleText);
                        }
                    }
                }

                // Get service description
                if (service.TryGetProperty("description", out var description))
                {
                    var descText = description.GetString();
                    if (!string.IsNullOrWhiteSpace(descText))
                        serviceContent.Add(descText);
                }

                // Get lead-in text
                if (service.TryGetProperty("leadIn", out var leadIn))
                {
                    var leadInText = leadIn.GetString();
                    if (!string.IsNullOrWhiteSpace(leadInText))
                        serviceContent.Add(leadInText);
                }

                // Get technologies
                if (service.TryGetProperty("technologies", out var technologies) && technologies.ValueKind == JsonValueKind.Array)
                {
                    foreach (var tech in technologies.EnumerateArray())
                    {
                        var techText = tech.GetString();
                        if (!string.IsNullOrWhiteSpace(techText))
                            serviceContent.Add(techText);
                    }
                }

                // Get approach items
                if (service.TryGetProperty("approach", out var approach) && approach.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in approach.EnumerateArray())
                    {
                        if (item.TryGetProperty("title", out var approachTitle))
                        {
                            var text = approachTitle.GetString();
                            if (!string.IsNullOrWhiteSpace(text))
                                serviceContent.Add(text);
                        }
                        if (item.TryGetProperty("content", out var approachContent))
                        {
                            var text = approachContent.GetString();
                            if (!string.IsNullOrWhiteSpace(text))
                                serviceContent.Add(text);
                        }
                    }
                }

                if (serviceContent.Count > 0)
                {
                    // Use slug-based URL if available
                    // For fvargas-portfolio specifically, services should link to /work/{slug}
                    // For other portfolios, we might need different logic, but using a direct link is generally safer than hash
                    // If this logic needs to be portfolio-specific, we can check portfolio.Slug
                    
                    string serviceUrl;
                    if (portfolio.Slug == "fernando") // Fernando's portfolio uses /work/{slug} routes
                    {
                         serviceUrl = !string.IsNullOrWhiteSpace(serviceSlug) 
                            ? $"/work/{serviceSlug}" 
                            : url;
                    }
                    else
                    {
                        // Default behavior for other portfolios (like busybee, jessica)
                        // Preserve existing hash-based navigation if that's what they use
                        serviceUrl = !string.IsNullOrWhiteSpace(serviceSlug) 
                            ? url  // If they don't have dedicated pages, stick to the main page
                            : url;
                        
                        // If you want them to also use /service/slug, change above. 
                        // But per your request "jessica and busybee... should not be affected",
                        // we stick to the generated 'url' passed into this method (which is usually /#services)
                    }

                    var section = !string.IsNullOrWhiteSpace(serviceSlug) && portfolio.Slug == "fernando"
                        ? null  // No section hash needed for dedicated pages
                        : $"service-{serviceIndex + 1}";

                    documents.Add(new SearchDocument
                    {
                        Id = $"{baseDocId}_service_{serviceIndex}",
                        PortfolioId = portfolio.Id,
                        PortfolioSlug = portfolio.Slug,
                        EntityType = record.EntityType,
                        EntityId = record.Id,
                        Title = serviceTitle,
                        Content = string.Join(" ", serviceContent.Where(s => !string.IsNullOrWhiteSpace(s))),
                        Url = serviceUrl,
                        Section = section,
                        UpdatedAt = record.UpdatedAt
                    });
                }

                serviceIndex++;
            }
        }

        return documents;
    }

    /// <summary>
    /// Extract a single document from a singleton entity (hero, about, etc.)
    /// </summary>
    private SearchDocument ExtractSingletonDocument(
        EntityRecord record, Portfolio portfolio, JsonElement root, string url, string title)
    {
        var content = new List<string>();
        ExtractTextFromElement(root, content);

        return new SearchDocument
        {
            Id = $"{portfolio.Id:N}_{record.EntityType}_{record.Id:N}",
            PortfolioId = portfolio.Id,
            PortfolioSlug = portfolio.Slug,
            EntityType = record.EntityType,
            EntityId = record.Id,
            Title = title,
            Content = string.Join(" ", content.Where(s => !string.IsNullOrWhiteSpace(s))),
            Url = url,
            Section = null,
            UpdatedAt = record.UpdatedAt
        };
    }

    /// <summary>
    /// Generic document extraction for unknown entity types
    /// </summary>
    private SearchDocument ExtractGenericDocument(
        EntityRecord record, Portfolio portfolio, JsonElement root, string url, string title)
    {
        var content = new List<string>();
        ExtractTextFromElement(root, content);

        return new SearchDocument
        {
            Id = $"{portfolio.Id:N}_{record.EntityType}_{record.Id:N}",
            PortfolioId = portfolio.Id,
            PortfolioSlug = portfolio.Slug,
            EntityType = record.EntityType,
            EntityId = record.Id,
            Title = title,
            Content = string.Join(" ", content.Where(s => !string.IsNullOrWhiteSpace(s))),
            Url = url,
            Section = null,
            UpdatedAt = record.UpdatedAt
        };
    }

    /// <summary>
    /// Recursively extract text content from a JSON element
    /// </summary>
    private void ExtractTextFromElement(JsonElement element, List<string> content)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                var text = element.GetString();
                if (!string.IsNullOrWhiteSpace(text) && !IsUrlOrPath(text))
                {
                    // Strip HTML tags for plain text
                    content.Add(StripHtml(text));
                }
                break;

            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    // Skip image/media fields
                    if (IsMediaProperty(property.Name))
                        continue;

                    ExtractTextFromElement(property.Value, content);
                }
                break;

            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    ExtractTextFromElement(item, content);
                }
                break;
        }
    }

    /// <summary>
    /// Extract the title from an entity record
    /// </summary>
    private string ExtractTitle(string entityType, JsonElement root)
    {
        // Try common title fields
        string[] titleFields = ["title", "name", "heading", "headline"];

        foreach (var field in titleFields)
        {
            if (root.TryGetProperty(field, out var value) && value.ValueKind == JsonValueKind.String)
            {
                var title = value.GetString();
                if (!string.IsNullOrWhiteSpace(title))
                    return title;
            }
        }

        // Fall back to entity type display name
        return FormatEntityTypeName(entityType);
    }

    /// <summary>
    /// Get the URL for an entity record
    /// </summary>
    private string GetUrlForEntity(string entityType, JsonElement root, string portfolioSlug)
    {
        // Check for slug field
        if (root.TryGetProperty("slug", out var slugElement))
        {
            var slug = slugElement.GetString();
            if (!string.IsNullOrWhiteSpace(slug))
            {
                return entityType switch
                {
                    "case-study-page" => $"/case-study/{slug}",
                    _ => $"/{slug}"
                };
            }
        }

        // Default URLs by entity type
        return entityType switch
        {
            "hero" => "/",
            "about" => "/#about",
            "experience" => "/#experience",
            "skills" => "/#skills",
            "services" => "/#services",
            "contact" => "/#contact",
            _ => "/"
        };
    }

    /// <summary>
    /// Format entity type name for display
    /// </summary>
    private static string FormatEntityTypeName(string entityType)
    {
        return entityType
            .Replace("-", " ")
            .Replace("_", " ")
            .Split(' ')
            .Select(w => char.ToUpper(w[0]) + w[1..].ToLower())
            .Aggregate((a, b) => $"{a} {b}");
    }

    /// <summary>
    /// Check if a property is likely a media/image field
    /// </summary>
    private static bool IsMediaProperty(string propertyName)
    {
        string[] mediaFields = ["image", "images", "thumbnail", "photo", "video", "media", "icon", "logo", "background"];
        return mediaFields.Any(f => propertyName.Contains(f, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Check if a string is likely a URL or file path
    /// </summary>
    private static bool IsUrlOrPath(string text)
    {
        return text.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
               text.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
               text.StartsWith("/") ||
               text.StartsWith("data:") ||
               text.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
               text.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
               text.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
               text.EndsWith(".gif", StringComparison.OrdinalIgnoreCase) ||
               text.EndsWith(".svg", StringComparison.OrdinalIgnoreCase) ||
               text.EndsWith(".webp", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Strip HTML tags from text
    /// </summary>
    private static string StripHtml(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
            return html;

        // Simple regex-free HTML stripping
        var result = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]*>", " ");
        result = System.Text.RegularExpressions.Regex.Replace(result, @"\s+", " ");
        return result.Trim();
    }

    /// <summary>
    /// Generate a URL-friendly slug from a title string
    /// Matches the frontend's generateSlug logic: lowercase, replace non-alphanumeric with hyphens
    /// </summary>
    private static string GenerateSlug(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            return string.Empty;

        // Convert to lowercase and replace non-alphanumeric characters with hyphens
        var slug = System.Text.RegularExpressions.Regex.Replace(title.ToLowerInvariant(), @"[^a-z0-9]+", "-");
        // Trim leading/trailing hyphens
        return slug.Trim('-');
    }
}
