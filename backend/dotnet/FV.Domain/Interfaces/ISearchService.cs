namespace FV.Domain.Interfaces;

/// <summary>
/// Document to be indexed in the search engine
/// </summary>
public class SearchDocument
{
    /// <summary>
    /// Unique identifier for the document (portfolioId_entityType_entityId_sectionIndex)
    /// </summary>
    public required string Id { get; set; }
    
    /// <summary>
    /// Portfolio this document belongs to
    /// </summary>
    public required Guid PortfolioId { get; set; }
    
    /// <summary>
    /// Portfolio slug for easy filtering
    /// </summary>
    public required string PortfolioSlug { get; set; }
    
    /// <summary>
    /// Entity type (e.g., case-study-page, hero, about)
    /// </summary>
    public required string EntityType { get; set; }
    
    /// <summary>
    /// Entity record ID
    /// </summary>
    public required Guid EntityId { get; set; }
    
    /// <summary>
    /// Title of the content
    /// </summary>
    public required string Title { get; set; }
    
    /// <summary>
    /// Main searchable content
    /// </summary>
    public required string Content { get; set; }
    
    /// <summary>
    /// URL path to link to this content
    /// </summary>
    public required string Url { get; set; }
    
    /// <summary>
    /// Section identifier for deep linking (e.g., "section-0", "header")
    /// </summary>
    public string? Section { get; set; }
    
    /// <summary>
    /// Optional vector embedding for semantic search
    /// </summary>
    public float[]? Embedding { get; set; }
    
    /// <summary>
    /// When this document was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Result from a search query
/// </summary>
public class SearchResult
{
    /// <summary>
    /// Document ID
    /// </summary>
    public required string Id { get; set; }
    
    /// <summary>
    /// Title of the content
    /// </summary>
    public required string Title { get; set; }
    
    /// <summary>
    /// Snippet of matching content with highlights
    /// </summary>
    public required string Snippet { get; set; }
    
    /// <summary>
    /// URL to navigate to
    /// </summary>
    public required string Url { get; set; }
    
    /// <summary>
    /// Section for deep linking
    /// </summary>
    public string? Section { get; set; }
    
    /// <summary>
    /// Entity type for categorization
    /// </summary>
    public required string EntityType { get; set; }
    
    /// <summary>
    /// Relevance score
    /// </summary>
    public double Score { get; set; }
    
    /// <summary>
    /// Highlighted text fragments
    /// </summary>
    public List<string> Highlights { get; set; } = [];
}

/// <summary>
/// Search query options
/// </summary>
public class SearchOptions
{
    /// <summary>
    /// The search query text
    /// </summary>
    public required string Query { get; set; }
    
    /// <summary>
    /// Portfolio ID to search within
    /// </summary>
    public required Guid PortfolioId { get; set; }
    
    /// <summary>
    /// Use AI-powered semantic search
    /// </summary>
    public bool UseSemanticSearch { get; set; } = false;
    
    /// <summary>
    /// Maximum number of results
    /// </summary>
    public int Limit { get; set; } = 10;
    
    /// <summary>
    /// Optional filter by entity types
    /// </summary>
    public List<string>? EntityTypes { get; set; }
}

/// <summary>
/// Service for indexing and searching content
/// </summary>
public interface ISearchService
{
    /// <summary>
    /// Initialize the search index for a portfolio
    /// </summary>
    Task InitializeIndexAsync(Guid portfolioId, string portfolioSlug, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Index a single document
    /// </summary>
    Task IndexDocumentAsync(SearchDocument document, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Index multiple documents in bulk
    /// </summary>
    Task IndexDocumentsAsync(IEnumerable<SearchDocument> documents, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Remove a document from the index
    /// </summary>
    Task DeleteDocumentAsync(string documentId, Guid portfolioId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Remove all documents for an entity
    /// </summary>
    Task DeleteEntityDocumentsAsync(Guid entityId, Guid portfolioId, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Search for documents
    /// </summary>
    Task<List<SearchResult>> SearchAsync(SearchOptions options, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get autocomplete suggestions
    /// </summary>
    Task<List<string>> GetSuggestionsAsync(string prefix, Guid portfolioId, int limit = 5, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Check if the search service is healthy
    /// </summary>
    Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default);
}
