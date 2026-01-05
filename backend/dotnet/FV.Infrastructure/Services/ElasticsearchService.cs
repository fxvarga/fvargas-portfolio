using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Core.Search;
using Elastic.Clients.Elasticsearch.QueryDsl;
using FV.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace FV.Infrastructure.Services;

/// <summary>
/// Elasticsearch implementation of the search service
/// </summary>
public class ElasticsearchService : ISearchService
{
    private readonly ElasticsearchClient _client;
    private readonly IEmbeddingService? _embeddingService;
    private readonly ILogger<ElasticsearchService> _logger;
    private const string IndexPrefix = "portfolio_";

    public ElasticsearchService(
        ElasticsearchClient client,
        ILogger<ElasticsearchService> logger,
        IEmbeddingService? embeddingService = null)
    {
        _client = client;
        _logger = logger;
        _embeddingService = embeddingService;
    }

    private static string GetIndexName(Guid portfolioId) => $"{IndexPrefix}{portfolioId:N}".ToLowerInvariant();

    public async Task InitializeIndexAsync(Guid portfolioId, string portfolioSlug, CancellationToken cancellationToken = default)
    {
        var indexName = GetIndexName(portfolioId);

        var existsResponse = await _client.Indices.ExistsAsync(indexName, cancellationToken);
        if (existsResponse.Exists)
        {
            _logger.LogInformation("Index {IndexName} already exists for portfolio {PortfolioSlug}", indexName, portfolioSlug);
            return;
        }

        _logger.LogInformation("Creating index {IndexName} for portfolio {PortfolioSlug}", indexName, portfolioSlug);

        var createResponse = await _client.Indices.CreateAsync(indexName, c => c
            .Settings(s => s
                .NumberOfShards(1)
                .NumberOfReplicas(0)
            )
            .Mappings(m => m
                .Properties<SearchDocument>(p => p
                    .Keyword(f => f.PortfolioId)
                    .Keyword(f => f.PortfolioSlug)
                    .Keyword(f => f.EntityType)
                    .Keyword(f => f.EntityId)
                    .Text(f => f.Title)
                    .Text(f => f.Content)
                    .Keyword(f => f.Url)
                    .Keyword(f => f.Section)
                    .Date(f => f.UpdatedAt)
                )
            )
        , cancellationToken);

        if (!createResponse.IsValidResponse)
        {
            _logger.LogError("Failed to create index {IndexName}: {Error}", indexName, createResponse.DebugInformation);
            throw new InvalidOperationException($"Failed to create Elasticsearch index: {createResponse.DebugInformation}");
        }

        _logger.LogInformation("Successfully created index {IndexName}", indexName);
    }

    public async Task IndexDocumentAsync(SearchDocument document, CancellationToken cancellationToken = default)
    {
        var indexName = GetIndexName(document.PortfolioId);

        // Generate embedding if semantic search is enabled and embedding service is available
        if (_embeddingService is { IsAvailable: true } && document.Embedding == null)
        {
            try
            {
                var textToEmbed = $"{document.Title} {document.Content}";
                document.Embedding = await _embeddingService.GenerateEmbeddingAsync(textToEmbed, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate embedding for document {DocumentId}", document.Id);
            }
        }

        var response = await _client.IndexAsync(document, idx => idx
            .Index(indexName)
            .Id(document.Id)
        , cancellationToken);

        if (!response.IsValidResponse)
        {
            _logger.LogError("Failed to index document {DocumentId}: {Error}", document.Id, response.DebugInformation);
            throw new InvalidOperationException($"Failed to index document: {response.DebugInformation}");
        }

        _logger.LogDebug("Indexed document {DocumentId} in {IndexName}", document.Id, indexName);
    }

    public async Task IndexDocumentsAsync(IEnumerable<SearchDocument> documents, CancellationToken cancellationToken = default)
    {
        var documentsList = documents.ToList();
        if (documentsList.Count == 0) return;

        // Generate embeddings if available
        if (_embeddingService is { IsAvailable: true })
        {
            foreach (var doc in documentsList.Where(d => d.Embedding == null))
            {
                try
                {
                    var textToEmbed = $"{doc.Title} {doc.Content}";
                    doc.Embedding = await _embeddingService.GenerateEmbeddingAsync(textToEmbed, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to generate embedding for document {DocumentId}", doc.Id);
                }
            }
        }

        // Group by portfolio for bulk indexing
        var byPortfolio = documentsList.GroupBy(d => d.PortfolioId);

        foreach (var group in byPortfolio)
        {
            var indexName = GetIndexName(group.Key);
            var docs = group.ToList();

            var response = await _client.BulkAsync(b => b
                .Index(indexName)
                .IndexMany(docs)
            , cancellationToken);

            if (response.Errors)
            {
                var errorItems = response.ItemsWithErrors.ToList();
                _logger.LogError("Bulk index had {ErrorCount} errors in {IndexName}", errorItems.Count, indexName);
                foreach (var item in errorItems.Take(5))
                {
                    _logger.LogError("Bulk index error for {Id}: {Error}", item.Id, item.Error?.Reason);
                }
            }
            else
            {
                _logger.LogInformation("Bulk indexed {Count} documents in {IndexName}", docs.Count, indexName);
            }
        }
    }

    public async Task DeleteDocumentAsync(string documentId, Guid portfolioId, CancellationToken cancellationToken = default)
    {
        var indexName = GetIndexName(portfolioId);

        var response = await _client.DeleteAsync(indexName, documentId, cancellationToken);

        if (!response.IsValidResponse && response.Result != Result.NotFound)
        {
            _logger.LogError("Failed to delete document {DocumentId}: {Error}", documentId, response.DebugInformation);
        }
    }

    public async Task DeleteEntityDocumentsAsync(Guid entityId, Guid portfolioId, CancellationToken cancellationToken = default)
    {
        var indexName = GetIndexName(portfolioId);

        var response = await _client.DeleteByQueryAsync<SearchDocument>(indexName, d => d
            .Query(q => q
                .Term(t => t.Field(f => f.EntityId).Value(entityId.ToString()))
            )
        , cancellationToken);

        if (!response.IsValidResponse)
        {
            _logger.LogError("Failed to delete documents for entity {EntityId}: {Error}", entityId, response.DebugInformation);
        }
        else
        {
            _logger.LogInformation("Deleted {Count} documents for entity {EntityId}", response.Deleted, entityId);
        }
    }

    public async Task<List<SearchResult>> SearchAsync(SearchOptions options, CancellationToken cancellationToken = default)
    {
        var indexName = GetIndexName(options.PortfolioId);

        // Check if we should use semantic search
        if (options.UseSemanticSearch && _embeddingService is { IsAvailable: true })
        {
            return await SemanticSearchAsync(options, indexName, cancellationToken);
        }

        // Standard full-text search
        return await FullTextSearchAsync(options, indexName, cancellationToken);
    }

    private async Task<List<SearchResult>> FullTextSearchAsync(SearchOptions options, string indexName, CancellationToken cancellationToken)
    {
        SearchResponse<SearchDocument> response;

        if (options.EntityTypes?.Count > 0)
        {
            response = await _client.SearchAsync<SearchDocument>(s => s
                .Index(indexName)
                .Size(options.Limit)
                .Query(q => q
                    .Bool(b => b
                        .Must(m => m
                            .MultiMatch(mm => mm
                                .Query(options.Query)
                                .Fields(new[] { "title^3", "content" })
                                .Type(TextQueryType.BestFields)
                                .Fuzziness(new Fuzziness("AUTO"))
                            )
                        )
                        .Filter(f => f
                            .Terms(t => t
                                .Field(fd => fd.EntityType)
                                .Terms(new TermsQueryField(options.EntityTypes.Select(et => FieldValue.String(et)).ToArray()))
                            )
                        )
                    )
                )
                .Highlight(h => h
                    .PreTags(["<mark>"])
                    .PostTags(["</mark>"])
                    .Fields(fd => fd
                        .Add("title", new HighlightField { NumberOfFragments = 0 })
                        .Add("content", new HighlightField { FragmentSize = 150, NumberOfFragments = 3 })
                    )
                )
            , cancellationToken);
        }
        else
        {
            response = await _client.SearchAsync<SearchDocument>(s => s
                .Index(indexName)
                .Size(options.Limit)
                .Query(q => q
                    .MultiMatch(mm => mm
                        .Query(options.Query)
                        .Fields(new[] { "title^3", "content" })
                        .Type(TextQueryType.BestFields)
                        .Fuzziness(new Fuzziness("AUTO"))
                    )
                )
                .Highlight(h => h
                    .PreTags(["<mark>"])
                    .PostTags(["</mark>"])
                    .Fields(fd => fd
                        .Add("title", new HighlightField { NumberOfFragments = 0 })
                        .Add("content", new HighlightField { FragmentSize = 150, NumberOfFragments = 3 })
                    )
                )
            , cancellationToken);
        }

        if (!response.IsValidResponse)
        {
            _logger.LogError("Search failed: {Error}", response.DebugInformation);
            return [];
        }

        return response.Hits.Select(hit => new SearchResult
        {
            Id = hit.Source!.Id,
            Title = hit.Source.Title,
            Snippet = GetSnippet(hit),
            Url = hit.Source.Url,
            Section = hit.Source.Section,
            EntityType = hit.Source.EntityType,
            Score = hit.Score ?? 0,
            Highlights = GetHighlights(hit)
        }).ToList();
    }

    private async Task<List<SearchResult>> SemanticSearchAsync(SearchOptions options, string indexName, CancellationToken cancellationToken)
    {
        // Generate embedding for the query (for future use with vector search)
        try
        {
            var _ = await _embeddingService!.GenerateEmbeddingAsync(options.Query, cancellationToken);
            _logger.LogDebug("Generated query embedding for semantic search");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate query embedding, falling back to text search");
        }

        // For now, use text search - vector search requires more complex setup
        return await FullTextSearchAsync(options, indexName, cancellationToken);
    }

    public async Task<List<string>> GetSuggestionsAsync(string prefix, Guid portfolioId, int limit = 5, CancellationToken cancellationToken = default)
    {
        var indexName = GetIndexName(portfolioId);

        try
        {
            var response = await _client.SearchAsync<SearchDocument>(s => s
                .Index(indexName)
                .Size(limit * 2) // Fetch extra for deduplication
                .Query(q => q
                    .MatchPhrasePrefix(p => p
                        .Field(f => f.Title)
                        .Query(prefix)
                    )
                )
            , cancellationToken);

            if (!response.IsValidResponse)
            {
                _logger.LogError("Autocomplete failed: {Error}", response.DebugInformation);
                return [];
            }

            return response.Hits
                .Where(h => h.Source != null)
                .Select(h => h.Source!.Title)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct()
                .Take(limit)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search suggestions for prefix '{Prefix}'", prefix);
            return [];
        }
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.Cluster.HealthAsync(cancellationToken);
            return response.IsValidResponse && response.Status != HealthStatus.Red;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Elasticsearch health check failed");
            return false;
        }
    }

    private static string GetSnippet(Hit<SearchDocument> hit)
    {
        // Prefer highlighted content
        if (hit.Highlight != null)
        {
            if (hit.Highlight.TryGetValue("content", out var contentHighlights) && contentHighlights.Count > 0)
            {
                return string.Join("... ", contentHighlights);
            }
            if (hit.Highlight.TryGetValue("title", out var titleHighlights) && titleHighlights.Count > 0)
            {
                return string.Join("... ", titleHighlights);
            }
        }

        // Fall back to truncated content
        var content = hit.Source?.Content ?? "";
        return content.Length > 200 ? content[..200] + "..." : content;
    }

    private static List<string> GetHighlights(Hit<SearchDocument> hit)
    {
        var highlights = new List<string>();

        if (hit.Highlight == null) return highlights;

        foreach (var kvp in hit.Highlight)
        {
            highlights.AddRange(kvp.Value);
        }

        return highlights;
    }
}
