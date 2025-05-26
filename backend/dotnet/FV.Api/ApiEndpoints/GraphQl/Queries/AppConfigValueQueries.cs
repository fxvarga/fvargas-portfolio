using FV.Domain.Models;
using FV.Infrastructure.Providers;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType("Query")]
public class AppConfigValueQueries
{
    public async Task<AppConfigValues> GetAppConfigValues([Service(ServiceKind.Resolver)] AppConfigProvider appConfigProvider)
    {
        return await appConfigProvider.GetFeatureFlags();
    }
}
