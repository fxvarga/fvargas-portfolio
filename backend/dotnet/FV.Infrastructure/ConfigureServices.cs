using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using FV.Domain.Interfaces;
using FV.Infrastructure.Providers;
using FV.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FV.Application
{
    public static class ConfigureServices
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            // Register tenant context as scoped (per-request)
            services.AddScoped<ITenantContext, TenantContext>();

            services.AddScoped<AppConfigProvider>();
            return services;
        }

        /// <summary>
        /// Add Elasticsearch and search services
        /// </summary>
        public static IServiceCollection AddSearchServices(
            this IServiceCollection services,
            string? elasticsearchUrl = null,
            string? azureOpenAiEndpoint = null,
            string? azureOpenAiApiKey = null,
            string? azureOpenAiEmbeddingDeployment = null)
        {
            // Configure Elasticsearch client
            var esUrl = elasticsearchUrl ?? Environment.GetEnvironmentVariable("ELASTICSEARCH_URL") ?? "http://localhost:9200";

            services.AddSingleton<ElasticsearchClient>(sp =>
            {
                var settings = new ElasticsearchClientSettings(new Uri(esUrl))
                    .DisableDirectStreaming()
                    .EnableDebugMode();

                return new ElasticsearchClient(settings);
            });

            // Configure embedding service (optional - for semantic search)
            var endpoint = azureOpenAiEndpoint ?? Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT");
            var apiKey = azureOpenAiApiKey ?? Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY");
            var deployment = azureOpenAiEmbeddingDeployment ?? Environment.GetEnvironmentVariable("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";

            if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(apiKey))
            {
                services.AddSingleton<IEmbeddingService>(sp =>
                {
                    var logger = sp.GetRequiredService<ILogger<AzureOpenAIEmbeddingService>>();
                    return new AzureOpenAIEmbeddingService(logger, endpoint, apiKey, deployment);
                });
            }
            else
            {
                // Register null embedding service
                services.AddSingleton<IEmbeddingService?>(sp => null);
            }

            // Register search service
            services.AddSingleton<ISearchService>(sp =>
            {
                var client = sp.GetRequiredService<ElasticsearchClient>();
                var logger = sp.GetRequiredService<ILogger<ElasticsearchService>>();
                var embeddingService = sp.GetService<IEmbeddingService>();
                return new ElasticsearchService(client, logger, embeddingService);
            });

            // Register indexing options
            services.AddSingleton<SearchIndexingOptions>();

            // Register background indexing service
            services.AddHostedService<SearchIndexingService>();

            return services;
        }
    }
}
