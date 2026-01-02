using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence.FileStorage;
using FV.Infrastructure.Providers;
using FV.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FV.Application
{
    public static class ConfigureServices
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            services.AddScoped<IUnitOfWork, FileBasedUnitOfWork>();
            
            // Register tenant context as scoped (per-request)
            services.AddScoped<ITenantContext, TenantContext>();

            services.AddScoped<AppConfigProvider>();
            return services;
        }
    }
}
