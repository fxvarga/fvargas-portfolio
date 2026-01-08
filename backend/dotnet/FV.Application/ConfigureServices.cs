

using FV.Application.Queries;
using FV.Application.Services;
using FV.Domain.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace FV.Application
{
    public static class ConfigureServices
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<ITextToImageGenService, HuggingFaceTextToImageService>();
            services.AddScoped<GenerateHeroImageQuery>();
            return services;
        }
    }
}
