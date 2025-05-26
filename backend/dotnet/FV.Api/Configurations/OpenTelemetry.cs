using System.Diagnostics.Metrics;
using Azure.Monitor.OpenTelemetry.Exporter;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace FV.Api.Configurations
{
    public static class OpenTelemetryConfiguration
    {
        private static readonly Meter myServiceMeter = new("FV.API", "1.0");

        // Define a Histogram instrument using the meter defined above
        public static Histogram<long> ResponseLatencyHistogram { get; } = myServiceMeter.CreateHistogram<long>("ResponseLatencyMs");

        public static IServiceCollection AddOpenTelemetryConfiguration(this IServiceCollection services, IConfiguration configuration)
        {
            var minValue = 10;
            var bucketSize = 10;
            var bucketCount = 2000;

            var firstBucketValue = minValue;
            var customBucketBounds = new double[bucketCount];

            for (int i = 0; i < bucketCount; i++)
            {
                customBucketBounds[i] = firstBucketValue;
                firstBucketValue += bucketSize;
            }

            var resourceBuilder = ResourceBuilder.CreateDefault().AddService(configuration.GetValue<string>("ServiceName") ?? "Missing Service Name");

            var appInsightsConnectionString = configuration.GetValue<string>("APPLICATIONINSIGHTS_CONNECTION_STRING");

            services.AddOpenTelemetry()
                .WithTracing(configure =>
                {
                    configure.SetSampler(new AlwaysOnSampler())
                    .AddHttpClientInstrumentation()
                    .AddAspNetCoreInstrumentation()
                    .AddHotChocolateInstrumentation()
                    .SetResourceBuilder(resourceBuilder);

                    if (!string.IsNullOrEmpty(appInsightsConnectionString))
                    {
                        configure.AddAzureMonitorTraceExporter(o => o.ConnectionString = appInsightsConnectionString);
                    }

                })
                .WithMetrics(configure =>
                {
                    configure.AddMeter(myServiceMeter.Name)
                          .AddView(instrumentName: ResponseLatencyHistogram.Name, new ExplicitBucketHistogramConfiguration() { Boundaries = customBucketBounds })
                          .AddHttpClientInstrumentation()
                          .AddAspNetCoreInstrumentation()
                          .SetResourceBuilder(resourceBuilder);

                    if (!string.IsNullOrEmpty(appInsightsConnectionString))
                    {
                        configure.AddAzureMonitorMetricExporter(o => o.ConnectionString = appInsightsConnectionString);
                    }

                });

            services.AddLogging(builder =>
            {
                builder.AddOpenTelemetry(options =>
                {
                        options.IncludeFormattedMessage = true;
                        options.IncludeScopes = true;
                        options.ParseStateValues = true;

                        if (!string.IsNullOrEmpty(appInsightsConnectionString))
                        {
                            options.AddAzureMonitorLogExporter(o => o.ConnectionString = appInsightsConnectionString);
                        }
                    });
            });

            return services;
        }
    }
}
