namespace AgentChat.Shared.Dtos;

/// <summary>
/// Context pack for RAG citations
/// </summary>
public record ContextPackDto
{
    public Guid Id { get; init; }
    public Guid RunId { get; init; }
    public Guid StepId { get; init; }
    public List<CitationDto> Sources { get; init; } = new();
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Individual citation from retrieval
/// </summary>
public record CitationDto
{
    /// <summary>
    /// Unique identifier for this source
    /// </summary>
    public required string SourceId { get; init; }
    
    /// <summary>
    /// Display title
    /// </summary>
    public required string Title { get; init; }
    
    /// <summary>
    /// URI to the original source
    /// </summary>
    public required string Uri { get; init; }
    
    /// <summary>
    /// Relevant text chunk from the source
    /// </summary>
    public required string ChunkText { get; init; }
    
    /// <summary>
    /// Relevance score (0-1)
    /// </summary>
    public double Score { get; init; }
}
