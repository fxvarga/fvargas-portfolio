namespace AgentChat.ApiBff.Middleware;

/// <summary>
/// Middleware to resolve tenant from request
/// </summary>
public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Try to get tenant from header
        if (context.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader))
        {
            if (Guid.TryParse(tenantHeader, out var tenantId))
            {
                context.Items["TenantId"] = tenantId;
            }
        }
        // Fall back to claim
        else if (context.User?.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = context.User.FindFirst("tenant_id");
            if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var tenantId))
            {
                context.Items["TenantId"] = tenantId;
            }
        }

        // Default tenant for development
        if (!context.Items.ContainsKey("TenantId"))
        {
            context.Items["TenantId"] = Guid.Empty;
            _logger.LogDebug("Using default tenant");
        }

        await _next(context);
    }
}
