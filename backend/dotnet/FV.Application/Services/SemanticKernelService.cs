// Copyright (c) Microsoft. All rights reserved.

using Azure.AI.OpenAI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.KernelMemory;
using Microsoft.SemanticKernel;

namespace FV.Api.Services;

/// <summary>
/// Extension methods for registering Semantic Kernel related services.
/// </summary>
public sealed class SemanticKernelService
{
    private readonly Kernel _kernel;

    public SemanticKernelService(IServiceProvider serviceProvider, IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        this._kernel = InitializeCompletionKernel(serviceProvider, configuration);
    }

    /// <summary>
    /// Produce semantic-kernel with only completion services for chat.
    /// </summary>
    public Kernel GetCompletionKernel() => this._kernel.Clone();

    private static Kernel InitializeCompletionKernel(
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        var builder = Kernel.CreateBuilder();

        builder.Services.AddLogging();

        var analysisOpenAiKey = "SemanticKernelOpenAi";

        var memoryOptions = serviceProvider.GetRequiredService<IOptions<KernelMemoryConfig>>().Value;

        var azureAIOptions = memoryOptions.GetServiceConfig<AzureOpenAIConfig>(configuration, "AzureOpenAIText");
        var azureAITextToImageOptions = memoryOptions.GetServiceConfig<AzureOpenAIConfig>(configuration, "AzureOpenAITextToImage");

        var azureOpenAiClient = serviceProvider.GetRequiredKeyedService<AzureOpenAIClient>(analysisOpenAiKey);

        switch (memoryOptions.TextGeneratorType)
        {
            case string x when x.Equals("AzureOpenAI", StringComparison.OrdinalIgnoreCase):
            case string y when y.Equals("AzureOpenAIText", StringComparison.OrdinalIgnoreCase):
#pragma warning disable CA2000 // No need to dispose of HttpClient instances from IHttpClientFactory
                builder.AddAzureOpenAIChatCompletion(
                    azureAIOptions.Deployment,
                    azureOpenAIClient: azureOpenAiClient,
                    serviceId: "AzureOpenAIText"); //make this a config
                break;

            default:
                throw new ArgumentException($"Invalid {nameof(memoryOptions.TextGeneratorType)} value in 'KernelMemory' settings.");
        }
#pragma warning disable SKEXP0010 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        builder.AddAzureOpenAITextToImage(azureAITextToImageOptions.Deployment, azureOpenAiClient, serviceId: "AzureOpenAITextToImage");
#pragma warning restore SKEXP0010 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.

        return builder.Build();
    }
}
