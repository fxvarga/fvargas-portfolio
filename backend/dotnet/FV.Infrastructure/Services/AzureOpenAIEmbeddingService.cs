using Azure.AI.OpenAI;
using FV.Domain.Interfaces;
using Microsoft.Extensions.Logging;
using OpenAI.Embeddings;
using System.ClientModel;

namespace FV.Infrastructure.Services;

/// <summary>
/// Azure OpenAI implementation of the embedding service
/// </summary>
public class AzureOpenAIEmbeddingService : IEmbeddingService
{
    private readonly EmbeddingClient? _client;
    private readonly ILogger<AzureOpenAIEmbeddingService> _logger;
    private readonly string _deploymentName;

    public AzureOpenAIEmbeddingService(
        ILogger<AzureOpenAIEmbeddingService> logger,
        string? endpoint = null,
        string? apiKey = null,
        string? deploymentName = null)
    {
        _logger = logger;
        _deploymentName = deploymentName ?? "text-embedding-ada-002";

        if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(apiKey))
        {
            try
            {
                var azureClient = new AzureOpenAIClient(
                    new Uri(endpoint),
                    new ApiKeyCredential(apiKey));
                _client = azureClient.GetEmbeddingClient(_deploymentName);
                _logger.LogInformation("Azure OpenAI Embedding Service initialized with deployment: {Deployment}", _deploymentName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Azure OpenAI client");
                _client = null;
            }
        }
        else
        {
            _logger.LogWarning("Azure OpenAI credentials not configured - semantic search will be disabled");
            _client = null;
        }
    }

    public bool IsAvailable => _client != null;

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken cancellationToken = default)
    {
        if (_client == null)
        {
            throw new InvalidOperationException("Embedding service is not available");
        }

        try
        {
            var response = await _client.GenerateEmbeddingAsync(text, cancellationToken: cancellationToken);
            return response.Value.ToFloats().ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embedding for text of length {Length}", text.Length);
            throw;
        }
    }

    public async Task<List<float[]>> GenerateEmbeddingsAsync(IEnumerable<string> texts, CancellationToken cancellationToken = default)
    {
        if (_client == null)
        {
            throw new InvalidOperationException("Embedding service is not available");
        }

        var textList = texts.ToList();
        var results = new List<float[]>();

        try
        {
            // Batch in groups of 16 (Azure OpenAI limit)
            const int batchSize = 16;
            for (int i = 0; i < textList.Count; i += batchSize)
            {
                var batch = textList.Skip(i).Take(batchSize).ToList();
                var response = await _client.GenerateEmbeddingsAsync(batch, cancellationToken: cancellationToken);
                
                foreach (var embedding in response.Value)
                {
                    results.Add(embedding.ToFloats().ToArray());
                }
            }

            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embeddings for {Count} texts", textList.Count);
            throw;
        }
    }
}
