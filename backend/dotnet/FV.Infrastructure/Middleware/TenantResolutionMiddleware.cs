using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace FV.Infrastructure.Middleware;

/// <summary>
/// Middleware that resolves the current tenant (portfolio) from the request.
/// Resolution order:
/// 1. X-Portfolio-ID header (for admin requests with portfolio switcher)
/// 2. Host header domain lookup (for public portfolio sites)
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    // Header name for admin portfolio selection
    public const string PortfolioIdHeader = "X-Portfolio-ID";

    // Paths that don't require tenant resolution
    private static readonly string[] ExcludedPaths = new[]
    {
        "/healthcheck",
        "/health",
        "/.well-known"
    };

    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(
        HttpContext context,
        ITenantContext tenantContext,
        CmsDbContext dbContext,
        IMemoryCache cache)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        // Skip tenant resolution for excluded paths
        if (ExcludedPaths.Any(p => path.StartsWith(p)))
        {
            await _next(context);
            return;
        }

        Portfolio? portfolio = null;
        bool isAdminRequest = false;

        // 1. Check for X-Portfolio-ID header (admin requests)
        if (context.Request.Headers.TryGetValue(PortfolioIdHeader, out var portfolioIdHeader))
        {
            if (Guid.TryParse(portfolioIdHeader.FirstOrDefault(), out var portfolioId))
            {
                portfolio = await GetPortfolioByIdAsync(dbContext, cache, portfolioId);
                isAdminRequest = true;

                if (portfolio != null)
                {
                    _logger.LogDebug("Tenant resolved from header: {PortfolioSlug} ({PortfolioId})",
                        portfolio.Slug, portfolio.Id);
                }
            }
        }

        // 2. Fall back to Host header lookup
        if (portfolio == null)
        {
            var host = context.Request.Host.Host.ToLowerInvariant();

            // Check if this is an admin subdomain
            if (host.StartsWith("admin."))
            {
                isAdminRequest = true;
                // For admin subdomain without X-Portfolio-ID, we'll use the first available portfolio
                // The frontend will handle portfolio selection
                portfolio = await GetFirstPortfolioAsync(dbContext, cache);

                if (portfolio != null)
                {
                    _logger.LogDebug("Admin request without portfolio selection, defaulting to: {PortfolioSlug}",
                        portfolio.Slug);
                }
            }
            else
            {
                // First, try exact domain lookup
                portfolio = await GetPortfolioByDomainAsync(dbContext, cache, host);

                // If not found, try slug-based subdomain pattern (e.g., jessica.localhost, busybee.localhost)
                if (portfolio == null && host.Contains('.'))
                {
                    var subdomain = host.Split('.')[0];
                    portfolio = await GetPortfolioBySlugAsync(dbContext, cache, subdomain);

                    if (portfolio != null)
                    {
                        _logger.LogDebug("Tenant resolved from subdomain slug: {Subdomain} -> {PortfolioSlug}",
                            subdomain, portfolio.Slug);
                    }
                }

                // If still not found and host is localhost or blog.localhost, default to first portfolio (Fernando)
                // blog.localhost is the Learning Lab subdomain which uses Fernando's blog content
                if (portfolio == null && (host == "localhost" || host == "127.0.0.1" || host == "blog.localhost"))
                {
                    portfolio = await GetFirstPortfolioAsync(dbContext, cache);

                    if (portfolio != null)
                    {
                        _logger.LogDebug("Localhost/blog request, defaulting to first portfolio: {PortfolioSlug}",
                            portfolio.Slug);
                    }
                }

                if (portfolio != null && !host.StartsWith("admin."))
                {
                    _logger.LogDebug("Tenant resolved from domain: {Domain} -> {PortfolioSlug}",
                        host, portfolio.Slug);
                }
            }
        }

        // Set tenant context if resolved
        if (portfolio != null)
        {
            if (isAdminRequest)
            {
                tenantContext.SetAdminTenant(portfolio.Id, portfolio.Slug);
            }
            else
            {
                tenantContext.SetTenant(portfolio.Id, portfolio.Slug);
            }
        }
        else
        {
            _logger.LogWarning("Could not resolve tenant for request: {Host}{Path}",
                context.Request.Host.Value, path);
        }

        await _next(context);
    }

    private async Task<Portfolio?> GetPortfolioByIdAsync(CmsDbContext dbContext, IMemoryCache cache, Guid portfolioId)
    {
        var cacheKey = $"portfolio:id:{portfolioId}";

        if (!cache.TryGetValue(cacheKey, out Portfolio? portfolio))
        {
            portfolio = await dbContext.Portfolios
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == portfolioId && p.IsActive);

            if (portfolio != null)
            {
                cache.Set(cacheKey, portfolio, TimeSpan.FromMinutes(5));
                // Also cache by domain and slug for cross-lookups
                cache.Set($"portfolio:domain:{portfolio.Domain.ToLowerInvariant()}", portfolio, TimeSpan.FromMinutes(5));
                cache.Set($"portfolio:slug:{portfolio.Slug.ToLowerInvariant()}", portfolio, TimeSpan.FromMinutes(5));
            }
        }

        return portfolio;
    }

    private async Task<Portfolio?> GetPortfolioByDomainAsync(CmsDbContext dbContext, IMemoryCache cache, string domain)
    {
        var cacheKey = $"portfolio:domain:{domain}";

        if (!cache.TryGetValue(cacheKey, out Portfolio? portfolio))
        {
            portfolio = await dbContext.Portfolios
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Domain.ToLower() == domain && p.IsActive);

            if (portfolio != null)
            {
                cache.Set(cacheKey, portfolio, TimeSpan.FromMinutes(5));
                // Also cache by ID and slug for cross-lookups
                cache.Set($"portfolio:id:{portfolio.Id}", portfolio, TimeSpan.FromMinutes(5));
                cache.Set($"portfolio:slug:{portfolio.Slug.ToLowerInvariant()}", portfolio, TimeSpan.FromMinutes(5));
            }
        }

        return portfolio;
    }

    private async Task<Portfolio?> GetFirstPortfolioAsync(CmsDbContext dbContext, IMemoryCache cache)
    {
        var cacheKey = "portfolio:first";

        if (!cache.TryGetValue(cacheKey, out Portfolio? portfolio))
        {
            portfolio = await dbContext.Portfolios
                .AsNoTracking()
                .Where(p => p.IsActive)
                .OrderBy(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (portfolio != null)
            {
                cache.Set(cacheKey, portfolio, TimeSpan.FromMinutes(5));
            }
        }

        return portfolio;
    }

    private async Task<Portfolio?> GetPortfolioBySlugAsync(CmsDbContext dbContext, IMemoryCache cache, string slug)
    {
        var cacheKey = $"portfolio:slug:{slug.ToLowerInvariant()}";

        if (!cache.TryGetValue(cacheKey, out Portfolio? portfolio))
        {
            portfolio = await dbContext.Portfolios
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Slug.ToLower() == slug.ToLower() && p.IsActive);

            if (portfolio != null)
            {
                cache.Set(cacheKey, portfolio, TimeSpan.FromMinutes(5));
                // Also cache by ID and domain for cross-lookups
                cache.Set($"portfolio:id:{portfolio.Id}", portfolio, TimeSpan.FromMinutes(5));
                cache.Set($"portfolio:domain:{portfolio.Domain.ToLowerInvariant()}", portfolio, TimeSpan.FromMinutes(5));
            }
        }

        return portfolio;
    }
}

/// <summary>
/// Extension method to register the tenant resolution middleware.
/// </summary>
public static class TenantResolutionMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<TenantResolutionMiddleware>();
    }
}
