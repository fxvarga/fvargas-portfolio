using System.Reflection;
using HotChocolate.Types.Descriptors;
using Microsoft.Extensions.Caching.Memory;

public class UseIpRateLimitAttribute : ObjectFieldDescriptorAttribute
{
    private readonly int _limit;
    private readonly int _seconds;

    public UseIpRateLimitAttribute(int limit, int seconds)
    {
        _limit = limit;
        _seconds = seconds;
    }

    protected override void OnConfigure(IDescriptorContext context, IObjectFieldDescriptor descriptor, MemberInfo member)
    {
        descriptor.Use(next => async ctx =>
        {
            var httpContext = ctx.Services.GetRequiredService<IHttpContextAccessor>().HttpContext;
            var cache = ctx.Services.GetRequiredService<IMemoryCache>();

            var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown";
            var cacheKey = $"ip:{ipAddress}:{ctx.Selection.Field.Name}";

            var callCount = cache.GetOrCreate(cacheKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(_seconds);
                return 0;
            });

            if (callCount >= _limit)
            {
                ctx.ReportError("Rate limit exceeded for your IP address. Try again later.");
                return;
            }

            cache.Set(cacheKey, callCount + 1, TimeSpan.FromSeconds(_seconds));

            await next(ctx);
        });
    }
}
