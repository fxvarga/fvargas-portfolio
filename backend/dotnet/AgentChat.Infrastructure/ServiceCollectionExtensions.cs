using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using StackExchange.Redis;
using AgentChat.Infrastructure.Approvals;
using AgentChat.Infrastructure.Configuration;
using AgentChat.Infrastructure.EventStore;
using AgentChat.Infrastructure.Messaging;
using AgentChat.Infrastructure.Persistence;
using AgentChat.Shared.Contracts;

namespace AgentChat.Infrastructure;

/// <summary>
/// Extension methods for configuring infrastructure services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add all infrastructure services
    /// </summary>
    public static IServiceCollection AddAgentChatInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDatabaseServices(configuration);
        services.AddMessagingServices(configuration);
        services.AddTelemetryServices(configuration);
        
        return services;
    }

    /// <summary>
    /// Add database and event store services
    /// </summary>
    public static IServiceCollection AddDatabaseServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<DatabaseOptions>(configuration.GetSection(DatabaseOptions.SectionName));

        services.AddDbContext<AgentChatDbContext>((sp, options) =>
        {
            var dbOptions = sp.GetRequiredService<IOptions<DatabaseOptions>>().Value;
            options.UseNpgsql(dbOptions.ConnectionString, npgsql =>
            {
                npgsql.EnableRetryOnFailure(dbOptions.MaxRetryCount);
                npgsql.CommandTimeout(dbOptions.CommandTimeout);
            });

            if (dbOptions.EnableSensitiveDataLogging)
            {
                options.EnableSensitiveDataLogging();
            }
        });

        services.AddScoped<IEventStore, PostgresEventStore>();
        services.AddScoped<IRunStateProjector, RunStateProjector>();
        services.AddScoped<IApprovalService, ApprovalService>();

        return services;
    }

    /// <summary>
    /// Add RabbitMQ and Redis services
    /// </summary>
    public static IServiceCollection AddMessagingServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<RabbitMqOptions>(configuration.GetSection(RabbitMqOptions.SectionName));
        services.Configure<RedisOptions>(configuration.GetSection(RedisOptions.SectionName));
        services.Configure<AzureOpenAiOptions>(configuration.GetSection(AzureOpenAiOptions.SectionName));

        // Redis connection
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var redisOptions = sp.GetRequiredService<IOptions<RedisOptions>>().Value;
            var configOptions = ConfigurationOptions.Parse(redisOptions.ConnectionString);
            configOptions.ConnectTimeout = redisOptions.ConnectTimeout;
            configOptions.SyncTimeout = redisOptions.SyncTimeout;
            configOptions.DefaultDatabase = redisOptions.Database;
            return ConnectionMultiplexer.Connect(configOptions);
        });

        services.AddSingleton<RedisEventPublisher>();
        services.AddSingleton<IEventPublisher>(sp => sp.GetRequiredService<RedisEventPublisher>());
        services.AddSingleton<IEventSubscriber>(sp => sp.GetRequiredService<RedisEventPublisher>());

        // RabbitMQ - singleton with async factory
        services.AddSingleton<IMessageQueue>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<RabbitMqOptions>>();
            var logger = sp.GetRequiredService<ILogger<RabbitMqMessageQueue>>();
            
            // Create async and block - this is safe during startup
            return RabbitMqMessageQueue.CreateAsync(options, logger).GetAwaiter().GetResult();
        });

        return services;
    }

    /// <summary>
    /// Add OpenTelemetry tracing
    /// </summary>
    public static IServiceCollection AddTelemetryServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<TelemetryOptions>(configuration.GetSection(TelemetryOptions.SectionName));

        services.AddOpenTelemetry()
            .ConfigureResource(resource =>
            {
                var options = configuration.GetSection(TelemetryOptions.SectionName).Get<TelemetryOptions>()
                    ?? new TelemetryOptions();
                resource.AddService(options.ServiceName);
            })
            .WithTracing(tracing =>
            {
                var options = configuration.GetSection(TelemetryOptions.SectionName).Get<TelemetryOptions>()
                    ?? new TelemetryOptions();

                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddSource("AgentChat.*");

                if (!string.IsNullOrEmpty(options.OtlpEndpoint))
                {
                    tracing.AddOtlpExporter(otlp =>
                    {
                        otlp.Endpoint = new Uri(options.OtlpEndpoint);
                    });
                }
            });

        return services;
    }
}
