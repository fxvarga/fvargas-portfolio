using FV.Api.ApiEndpoints.GraphQl.Mutations;
using FV.Api.ApiEndpoints.GraphQl.Queries;
using FV.Api.ApiEndpoints.GraphQl.Subscriptions;
using HotChocolate.Types.Pagination;

namespace FV.Api.Configurations;
public static class ConfigureGraphQlServices
{
    public static IServiceCollection AddGraphQlServices(this IServiceCollection services, IConfiguration config)
    {
        var configTimeout = config.GetSection("SiteSettings").GetValue<int>("HotChocolateExecutionTimeoutInSeconds");

        services.AddHttpClient();

        services.AddGraphQLServer()
            .ModifyRequestOptions(o => o.ExecutionTimeout = TimeSpan.FromSeconds(configTimeout))
            .SetPagingOptions(new PagingOptions
            {
                MaxPageSize = config.GetSection("SiteSettings").GetValue<int>("GraphQlPaginationMax"),
                InferCollectionSegmentNameFromField = false
            })
            .AddSorting()
            .AddType(new UuidType('D'))
            .AddType<AnyType>()
            .AddQueryType()
            .AddTypeExtension<AppConfigValueQueries>()
            .AddTypeExtension<GenerativeQueries>()
            .AddTypeExtension<SessionQueries>()
            .AddTypeExtension<EntityDefinitionQueries>()
            .AddTypeExtension<EntityRecordQueries>()
            .AddTypeExtension<ContentQueries>()
            .AddMutationType()
            .AddTypeExtension<EntityDefinitionMutations>()
            .AddTypeExtension<EntityRecordMutations>()
            .AddTypeExtension<AuthMutations>()
            .AddTypeExtension<ContentMutations>()
            .AddAuthorization()
            .AddHttpRequestInterceptor((context, executor, requestBuilder, ct) =>
            {
                var userId = context.User?.Identity?.Name;
                if (!string.IsNullOrEmpty(userId))
                {
                    requestBuilder.SetGlobalState("UserId", userId);
                }
                return ValueTask.CompletedTask;
            })
            .AddSubscriptionType<SessionSubscriptions>()
            .AddInMemorySubscriptions()
            .BindRuntimeType<IDictionary<string, object>, AnyType>()
            .InitializeOnStartup();
        return services;
    }
}
