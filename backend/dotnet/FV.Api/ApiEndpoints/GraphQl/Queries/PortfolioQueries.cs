using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class PortfolioQueries
{
    /// <summary>
    /// Get all portfolios the current user has access to (for admin portfolio switcher)
    /// </summary>
    [Authorize]
    public async Task<List<PortfolioInfo>> GetMyPortfolios(
        ClaimsPrincipal claimsPrincipal,
        [Service] CmsDbContext dbContext)
    {
        var userId = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return new List<PortfolioInfo>();
        }

        // Get portfolios through UserPortfolio junction table
        var portfolios = await dbContext.UserPortfolios
            .Where(up => up.UserId == userGuid)
            .Include(up => up.Portfolio)
            .Select(up => new PortfolioInfo
            {
                Id = up.Portfolio.Id,
                Slug = up.Portfolio.Slug,
                Name = up.Portfolio.Name,
                Domain = up.Portfolio.Domain,
                IsActive = up.Portfolio.IsActive
            })
            .ToListAsync();

        return portfolios;
    }

    /// <summary>
    /// Get the current portfolio context (from tenant resolution)
    /// </summary>
    [Authorize]
    public PortfolioInfo? GetCurrentPortfolio(
        [Service] ITenantContext tenantContext,
        [Service] CmsDbContext dbContext)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            return null;
        }

        var portfolio = dbContext.Portfolios
            .FirstOrDefault(p => p.Id == tenantContext.PortfolioId.Value);

        if (portfolio == null)
        {
            return null;
        }

        return new PortfolioInfo
        {
            Id = portfolio.Id,
            Slug = portfolio.Slug,
            Name = portfolio.Name,
            Domain = portfolio.Domain,
            IsActive = portfolio.IsActive
        };
    }

    /// <summary>
    /// Get all portfolios (admin only - for super admin management)
    /// </summary>
    [Authorize(Roles = new[] { "Admin" })]
    public async Task<List<PortfolioInfo>> GetAllPortfolios(
        [Service] CmsDbContext dbContext)
    {
        return await dbContext.Portfolios
            .Select(p => new PortfolioInfo
            {
                Id = p.Id,
                Slug = p.Slug,
                Name = p.Name,
                Domain = p.Domain,
                IsActive = p.IsActive
            })
            .ToListAsync();
    }
}

/// <summary>
/// DTO for portfolio information returned by GraphQL
/// </summary>
public class PortfolioInfo
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Domain { get; set; }
    public bool IsActive { get; set; }
}
