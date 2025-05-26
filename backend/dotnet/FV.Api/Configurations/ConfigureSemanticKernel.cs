using System.ClientModel.Primitives;
using Azure.AI.OpenAI;
using Azure.Core;
using Azure.Identity;
using FV.Api.Services;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using Microsoft.KernelMemory;
using Microsoft.SemanticKernel;

public static class ConfigureSemanticKernel
{
    // public static IServiceCollection AddSemanticKernelServices(this IServiceCollection services, IConfiguration config)
    // {

    //     var analysisHttpKey = "SemanticKernelHttpClient";
    //     var analysisOpenAiKey = "SemanticKernelOpenAi";
    //     services.AddKeyedTransient<HttpClient>(analysisHttpKey, (sp, key) =>
    //     {
    //         var analysisChatOptions = sp.GetRequiredService<IOptions<ChatOptions>>().Value;
    //         return new HttpClient() { Timeout = TimeSpan.FromMinutes(15) };
    //     });
    //     services.AddKeyedTransient<AzureOpenAIClient>(analysisOpenAiKey, (sp, key) =>
    //     {
    //         var memoryOptions = sp.GetRequiredService<IOptions<KernelMemoryConfig>>().Value;
    //         var azureAIOptions = memoryOptions.GetServiceConfig<AzureOpenAIConfig>(config, "AzureOpenAIText");

    //         var httpClient = sp.GetRequiredKeyedService<HttpClient>(analysisHttpKey);
    //         var analysisChatOptions = sp.GetRequiredService<IOptions<ChatOptions>>().Value;

    //         //TODO: Confirm options that can be added here
    //         var clientOptions = new AzureOpenAIClientOptions
    //         {
    //             Transport = new HttpClientPipelineTransport(httpClient)
    //         };
    //         TokenCredential aiCredential = new DefaultAzureCredential();
    //         return new AzureOpenAIClient(new Uri(azureAIOptions.Endpoint), aiCredential, clientOptions);
    //     });
    //     services.AddSingleton(sp => new SemanticKernelService(sp, config, sp.GetRequiredService<IHttpClientFactory>()));
    //     // Semantic Kernel
    //     services.AddScoped<Kernel>(
    //         sp =>
    //         {
    //             var provider = sp.GetRequiredService<SemanticKernelService>();
    //             var kernel = provider.GetCompletionKernel();
    //             return kernel;
    //         });


    //     return services;

    // }
}