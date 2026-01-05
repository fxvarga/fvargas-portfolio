namespace FV.Domain.Interfaces;

/// <summary>
/// Service for generating text embeddings for semantic search
/// </summary>
public interface IEmbeddingService
{
    /// <summary>
    /// Generate an embedding vector for the given text
    /// </summary>
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generate embeddings for multiple texts in batch
    /// </summary>
    Task<List<float[]>> GenerateEmbeddingsAsync(IEnumerable<string> texts, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if the embedding service is available
    /// </summary>
    bool IsAvailable { get; }
}
