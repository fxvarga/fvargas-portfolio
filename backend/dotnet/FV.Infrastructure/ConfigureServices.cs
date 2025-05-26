using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence.FileStorage;
using FV.Infrastructure.Providers;
using Microsoft.Extensions.DependencyInjection;

namespace FV.Application
{
    public static class ConfigureServices
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            services.AddScoped<IUnitOfWork, FileBasedUnitOfWork>();

            services.AddScoped<AppConfigProvider>();
            return services;
        }
    }
}
