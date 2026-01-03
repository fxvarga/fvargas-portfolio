using FV.Domain.Interfaces;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class SearchQueries
{
    /// <summary>
    /// Search for content across the portfolio
    /// </summary>
    public async Task<SearchQueryResult> Search(
        string query,
        bool? useSemanticSearch,
        int? limit,
        List<string>? entityTypes,
        [Service] ISearchService searchService,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return new SearchQueryResult
            {
                Results = [],
                Query = query,
                TotalResults = 0
            };
        }

        var options = new SearchOptions
        {
            Query = query,
            PortfolioId = tenantContext.PortfolioId!.Value,
            UseSemanticSearch = useSemanticSearch ?? false,
            Limit = limit ?? 10,
            EntityTypes = entityTypes
        };

        var results = await searchService.SearchAsync(options);

        return new SearchQueryResult
        {
            Results = results.Select(r => new SearchResultItem
            {
                Id = r.Id,
                Title = r.Title,
                Snippet = r.Snippet,
                Url = r.Url,
                Section = r.Section,
                EntityType = r.EntityType,
                Score = r.Score,
                Highlights = r.Highlights
            }).ToList(),
            Query = query,
            TotalResults = results.Count
        };
    }

    /// <summary>
    /// Get autocomplete suggestions for search
    /// </summary>
    public async Task<List<string>> GetSearchSuggestions(
        string prefix,
        int? limit,
        [Service] ISearchService searchService,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved || string.IsNullOrWhiteSpace(prefix))
        {
            return [];
        }

        return await searchService.GetSuggestionsAsync(
            prefix,
            tenantContext.PortfolioId!.Value,
            limit ?? 5
        );
    }

    /// <summary>
    /// Check if search service is available and healthy
    /// </summary>
    public async Task<bool> IsSearchAvailable(
        [Service] ISearchService searchService)
    {
        return await searchService.IsHealthyAsync();
    }
}

/// <summary>
/// Result of a search query
/// </summary>
public class SearchQueryResult
{
    /// <summary>
    /// The search query that was executed
    /// </summary>
    public string Query { get; set; } = default!;

    /// <summary>
    /// List of search results
    /// </summary>
    public List<SearchResultItem> Results { get; set; } = [];

    /// <summary>
    /// Total number of results found
    /// </summary>
    public int TotalResults { get; set; }
}

/// <summary>
/// A single search result item
/// </summary>
public class SearchResultItem
{
    /// <summary>
    /// Unique identifier for the result
    /// </summary>
    public string Id { get; set; } = default!;

    /// <summary>
    /// Title of the content
    /// </summary>
    public string Title { get; set; } = default!;

    /// <summary>
    /// Snippet of matching content (may contain HTML highlight marks)
    /// </summary>
    public string Snippet { get; set; } = default!;

    /// <summary>
    /// URL to navigate to this content
    /// </summary>
    public string Url { get; set; } = default!;

    /// <summary>
    /// Section identifier for deep linking (e.g., "section-0")
    /// </summary>
    public string? Section { get; set; }

    /// <summary>
    /// Type of entity (e.g., "case-study-page", "about")
    /// </summary>
    public string EntityType { get; set; } = default!;

    /// <summary>
    /// Relevance score (higher is better)
    /// </summary>
    public double Score { get; set; }

    /// <summary>
    /// Highlighted text fragments showing matched terms
    /// </summary>
    public List<string> Highlights { get; set; } = [];
}
