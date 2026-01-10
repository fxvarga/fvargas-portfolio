using AgentChat.PortfolioAgent.Security;
using AgentChat.PortfolioAgent.Services;
using AgentChat.PortfolioAgent.Tools;
using AgentChat.Shared.Contracts;
using Microsoft.Extensions.DependencyInjection;

namespace AgentChat.PortfolioAgent;

/// <summary>
/// Extension methods for registering Portfolio Agent services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add Portfolio Agent services to the dependency injection container
    /// </summary>
    public static IServiceCollection AddPortfolioAgent(this IServiceCollection services)
    {
        // Security services
        services.AddSingleton<IPiiDetector, PiiDetector>();
        services.AddSingleton<IRateLimiter, InMemoryRateLimiter>();

        // Core services (in-memory implementations for MVP)
        // In production, replace with PostgreSQL/pgvector implementations
        services.AddSingleton<IAgentMemoryService, InMemoryAgentMemoryService>();
        services.AddSingleton<IActivityLogService, InMemoryActivityLogService>();
        services.AddSingleton<IDraftService, InMemoryDraftService>();

        return services;
    }

    /// <summary>
    /// Add Portfolio Agent tools to the dependency injection container
    /// </summary>
    public static IServiceCollection AddPortfolioAgentTools(this IServiceCollection services)
    {
        // Search tools (visitor-allowed)
        services.AddSingleton<ITool, PortfolioSearchTool>();
        services.AddSingleton<ITool, PortfolioGetContentTool>();
        services.AddSingleton<ITool, PortfolioSuggestionsTool>();

        // Memory tools
        services.AddSingleton<ITool, RememberFactTool>();
        services.AddSingleton<ITool, RecallPublicMemoriesTool>();
        services.AddSingleton<ITool, RecallAllMemoriesTool>();
        services.AddSingleton<ITool, LogDecisionTool>();

        // Analysis tools
        services.AddSingleton<ITool, AnalyzeFreshnessTool>();
        services.AddSingleton<ITool, AnalyzeSeoTool>();
        services.AddSingleton<ITool, LogActivityTool>();

        // Draft tools
        services.AddSingleton<ITool, CreateDraftTool>();
        services.AddSingleton<ITool, QueueProposalTool>();
        services.AddSingleton<ITool, GetPendingReviewsTool>();

        return services;
    }
}
