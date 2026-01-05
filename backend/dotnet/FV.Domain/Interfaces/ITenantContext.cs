namespace FV.Domain.Interfaces;

/// <summary>
/// Provides access to the current tenant (portfolio) context.
/// This is resolved per-request based on domain or header.
/// </summary>
public interface ITenantContext
{
    /// <summary>
    /// The current portfolio ID. Null if not resolved (e.g., healthcheck endpoints).
    /// </summary>
    Guid? PortfolioId { get; }

    /// <summary>
    /// The current portfolio slug (e.g., "fernando", "jessica").
    /// </summary>
    string? PortfolioSlug { get; }

    /// <summary>
    /// Whether a tenant has been resolved for this request.
    /// </summary>
    bool IsResolved { get; }

    /// <summary>
    /// Whether this is an admin request (from admin subdomain or with X-Portfolio-ID header).
    /// </summary>
    bool IsAdminRequest { get; }

    /// <summary>
    /// Sets the tenant context. Called by middleware.
    /// </summary>
    void SetTenant(Guid portfolioId, string portfolioSlug, bool isAdminRequest = false);

    /// <summary>
    /// Sets the tenant as an admin request with a specific portfolio selection.
    /// </summary>
    void SetAdminTenant(Guid portfolioId, string portfolioSlug);

    /// <summary>
    /// Clears the tenant context.
    /// </summary>
    void Clear();
}
