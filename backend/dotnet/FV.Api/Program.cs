using FV.Api.Providers;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.FeatureManagement;
using FV.Api.Configurations;
using FV.Application;
using Microsoft.KernelMemory;
using FV.Infrastructure;
using FV.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

var services = builder.Services;
var config = builder.Configuration;

var isDevelopment = builder.Environment.IsDevelopment();
// Add services to the container.
//
// services.Configure<KernelMemoryConfig>(config.GetSection("KernelMemory"));
// services.AddSemanticKernelOptions(config);
services.AddPersistentChatStore();
// services.AddSemanticKernelServices(config);
// services.AddKernelMemoryServices(config);
services.AddHttpContextAccessor();
services.AddAzureAppConfiguration();
services.AddFeatureManagement();
services.AddGraphQlServices(config);
services.AddHealthChecks();
services.AddOpenTelemetryConfiguration(config);
services.AddApplicationServices();
services.AddInfrastructureServices();

// Register CORS services first

// if (!isDevelopment)
// {
//     AzureConfigProvider.AddAzureConfig(config);
// }

services.AddCors(options =>
{
    if (isDevelopment)
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
        });
    }
    if (!isDevelopment)
    {
        options.AddDefaultPolicy(builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
    }
});

services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
services.AddMemoryCache();

var app = builder.Build();

// Add session tracking middleware early in the pipeline

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapBananaCakePop();
}
else
{
    app.UseHsts();
}
app.UseCors();
app.UseHttpsRedirection();
app.UseRouting();
app.MapHealthChecks("/healthcheck", new HealthCheckOptions() { Predicate = (check) => !check.Tags.Contains("HealthCheck") });
app.MapGraphQL();
app.UseWebSockets();
await app.RunAsync();