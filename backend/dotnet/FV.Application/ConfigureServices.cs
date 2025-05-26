
using FV.Application.Commands.EntityDefinition;
using FV.Application.Commands.EntityRecord;
using FV.Application.Queries;
using FV.Application.Queries.EntityDefinition;
using FV.Application.Queries.EntityRecord;
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
            services.AddScoped<GetAllEntityDefinitionsQueryHandler>();
            services.AddScoped<GetEntityDefinitionByIdQueryHandler>();
            services.AddScoped<CreateEntityDefinitionCommandHandler>();
            services.AddScoped<DeleteEntityDefinitionCommandHandler>();
            services.AddScoped<UpdateEntityDefinitionCommandHandler>();
            services.AddScoped<CreateEntityRecordHandler>();

            // Queries
            services.AddScoped<GetEntityRecordByIdQueryHandler>();
            services.AddScoped<GetEntityRecordsByTypeQueryHandler>();
            return services;
        }
    }
}
