using FV.Domain.Interfaces;

namespace FV.Infrastructure.Services;

/// <summary>
/// Scoped service that holds the current tenant context for a request.
/// </summary>
public class TenantContext : ITenantContext
{
    public Guid? PortfolioId { get; private set; }
    public string? PortfolioSlug { get; private set; }
    public bool IsResolved => PortfolioId.HasValue;
    public bool IsAdminRequest { get; private set; }

    public void SetTenant(Guid portfolioId, string portfolioSlug, bool isAdminRequest = false)
    {
        PortfolioId = portfolioId;
        PortfolioSlug = portfolioSlug;
        IsAdminRequest = isAdminRequest;
    }

    public void SetAdminTenant(Guid portfolioId, string portfolioSlug)
    {
        SetTenant(portfolioId, portfolioSlug, isAdminRequest: true);
    }

    public void Clear()
    {
        PortfolioId = null;
        PortfolioSlug = null;
        IsAdminRequest = false;
    }
}
