// Copyright (c) Microsoft. All rights reserved.

using System.ClientModel.Primitives;
using Azure.AI.OpenAI;
using Azure.Core;
using Azure.Identity;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using Microsoft.KernelMemory;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Plugins.Core;
using System.Reflection;

using FV.Api.Configurations;
using FV.Api.Services;
using FV.Infrastructure.Persistence.ChatMemoryStorage;
using FV.Infrastructure.Options;
using FV.Infrastructure.Interfaces;
/// <summary>
/// Extension methods for registering Semantic Kernel related services.
/// </summary>
internal static class SemanticKernelExtensions
{
    /// <summary>
    /// Delegate to register functions with a Semantic Kernel
    /// </summary>
    public delegate Task RegisterFunctionsWithKernel(IServiceProvider sp, Kernel kernel);
    public delegate Task RegisterChatCompletions(IServiceProvider sp, Kernel kernel);

    /// <summary>
    /// Delegate for any complimentary setup of the kernel, i.e., registering custom plugins, etc.
    /// See webapi/README.md#Add-Custom-Setup-to-Chat-Copilot's-Kernel for more details.
    /// </summary>
    public delegate Task KernelSetupHook(IServiceProvider sp, Kernel kernel);

    /// <summary>
    /// Add Semantic Kernel services
    /// </summary>
    public static IServiceCollection AddSemanticKernelServices(this IServiceCollection services, IConfiguration config)
    {

        var analysisHttpKey = "AnalysisHttp";
        var analysisOpenAiKey = "AnalysisOpenAi";
        services.AddKeyedTransient<HttpClient>(analysisHttpKey, (sp, key) =>
        {
            var analysisChatOptions = sp.GetRequiredService<IOptions<ChatOptions>>().Value;
            return new HttpClient() { Timeout = TimeSpan.FromMinutes(15) };
        });
        services.AddKeyedTransient<AzureOpenAIClient>(analysisOpenAiKey, (sp, key) =>
        {
            var memoryOptions = sp.GetRequiredService<IOptions<KernelMemoryConfig>>().Value;
            var azureAIOptions = memoryOptions.GetServiceConfig<AzureOpenAIConfig>(config, "AzureOpenAIText");

            var httpClient = sp.GetRequiredKeyedService<HttpClient>(analysisHttpKey);
            var analysisChatOptions = sp.GetRequiredService<IOptions<ChatOptions>>().Value;

            //TODO: Confirm options that can be added here
            var clientOptions = new AzureOpenAIClientOptions
            {
                Transport = new HttpClientPipelineTransport(httpClient)
            };
            TokenCredential aiCredential = new DefaultAzureCredential();
            return new AzureOpenAIClient(new Uri(azureAIOptions.Endpoint), aiCredential, clientOptions);
        });
        services.AddSingleton(sp => new SemanticKernelService(sp, config, sp.GetRequiredService<IHttpClientFactory>()));
        // Semantic Kernel
        services.AddScoped<Kernel>(
            sp =>
            {
                var provider = sp.GetRequiredService<SemanticKernelService>();
                var kernel = provider.GetCompletionKernel();

                sp.GetRequiredService<RegisterFunctionsWithKernel>()(sp, kernel);

                // If KernelSetupHook is not null, invoke custom kernel setup.
                sp.GetService<KernelSetupHook>()?.Invoke(sp, kernel);
                return kernel;
            });

        // Azure Content Safety
        // builder.Services.AddContentSafety();

        // Register plugins
        services.AddScoped<RegisterFunctionsWithKernel>(sp => RegisterChatCopilotFunctionsAsync);

        // Add any additional setup needed for the kernel.
        // Uncomment the following line and pass in a custom hook for any complimentary setup of the kernel.
        services.AddKernelSetupHook(RegisterPluginsAsync);

        return services;
    }

    /// <summary>
    /// Add embedding model
    /// </summary>
    // public static WebApplicationBuilder AddBotConfig(this WebApplicationBuilder builder)
    // {
    //     builder.Services.AddScoped(sp => sp.WithBotConfig(builder.Configuration));

    //     return builder;
    // }

    /// <summary>
    /// Register custom hook for any complimentary setup of the kernel.
    /// </summary>
    /// <param name="hook">The delegate to perform any additional setup of the kernel.</param>
    public static IServiceCollection AddKernelSetupHook(this IServiceCollection services, KernelSetupHook hook)
    {
        // Add the hook to the service collection
        services.AddScoped<KernelSetupHook>(sp => hook);
        return services;
    }

    /// <summary>
    /// Register the chat plugin with the kernel.
    /// </summary>
    public static Kernel RegisterChatPlugin(this Kernel kernel, IServiceProvider sp)
    {
        // Chat plugin
        kernel.ImportPluginFromObject(
            new ChatPlugin(
                kernel,
                memoryClient: sp.GetRequiredService<IKernelMemory>(),
                chatMessageRepository: sp.GetRequiredService<ChatMessageRepository>(),
                chatSessionRepository: sp.GetRequiredService<ChatSessionRepository>(),
                messageService: sp.GetRequiredService<IMessageService>(),
                promptOptions: sp.GetRequiredService<IOptions<PromptsOptions>>(),
                // documentImportOptions: sp.GetRequiredService<IOptions<DocumentMemoryOptions>>(),
                logger: sp.GetRequiredService<ILogger<ChatPlugin>>()),
            nameof(ChatPlugin));

        return kernel;
    }
    /// <summary>
    /// Register functions with the main kernel responsible for handling Chat Copilot requests.
    /// </summary>
    private static Task RegisterChatCopilotFunctionsAsync(IServiceProvider sp, Kernel kernel)
    {
        // Chat Copilot functions,

        kernel.RegisterChatPlugin(sp);

        // Time plugin
#pragma warning disable SKEXP0050 // Type is for evaluation purposes only and is subject to change or removal in future updates. Suppress this diagnostic to proceed.
        kernel.ImportPluginFromObject(new TimePlugin(), nameof(TimePlugin));

        return Task.CompletedTask;
    }


    /// <summary>
    /// Register plugins with a given kernel.
    /// </summary>
    private static Task RegisterPluginsAsync(IServiceProvider sp, Kernel kernel)
    {
        var logger = kernel.LoggerFactory.CreateLogger(nameof(Kernel));

        // Semantic plugins
        ChatServiceOptions options = sp.GetRequiredService<IOptions<ChatServiceOptions>>().Value;
        if (!string.IsNullOrWhiteSpace(options.SemanticPluginsDirectory))
        {
            foreach (string subDir in Directory.GetDirectories(options.SemanticPluginsDirectory))
            {
                try
                {
                    kernel.ImportPluginFromPromptDirectory(options.SemanticPluginsDirectory, System.IO.Path.GetFileName(subDir)!);
                }
                catch (KernelException ex)
                {
                    logger.LogError("Could not load plugin from {Directory}: {Message}", subDir, ex.Message);
                }
            }
        }

        // Native plugins
        if (!string.IsNullOrWhiteSpace(options.NativePluginsDirectory))
        {
            // Loop through all the files in the directory that have the .cs extension
            var pluginFiles = Directory.GetFiles(options.NativePluginsDirectory, "*.cs");
            foreach (var file in pluginFiles)
            {
                // Parse the name of the class from the file name (assuming it matches)
                var className = System.IO.Path.GetFileNameWithoutExtension(file);

                // Get the type of the class from the current assembly
                var assembly = Assembly.GetExecutingAssembly();
                var classType = assembly.GetTypes().FirstOrDefault(t => t.Name.Contains(className, StringComparison.CurrentCultureIgnoreCase));

                // If the type is found, create an instance of the class using the default constructor
                if (classType != null)
                {
                    try
                    {
                        var plugin = Activator.CreateInstance(classType);
                        kernel.ImportPluginFromObject(plugin!, classType.Name!);
                    }
                    catch (KernelException ex)
                    {
                        logger.LogError("Could not load plugin from file {File}: {Details}", file, ex.Message);
                    }
                }
                else
                {
                    logger.LogError("Class type not found. Make sure the class type matches exactly with the file name {FileName}", className);
                }
            }
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Adds Azure Content Safety
    /// </summary>
    // internal static void AddContentSafety(this IServiceCollection services)
    // {
    //     IConfiguration configuration = services.BuildServiceProvider().GetRequiredService<IConfiguration>();
    //     var options = configuration.GetSection(ContentSafetyOptions.PropertyName).Get<ContentSafetyOptions>() ?? new ContentSafetyOptions { Enabled = false };
    //     services.AddSingleton<IContentSafetyService>(sp => new AzureContentSafety(options.Endpoint, options.Key));
    // }

    /// <summary>
    /// Get the embedding model from the configuration.
    /// </summary>
    // private static ChatArchiveEmbeddingConfig WithBotConfig(this IServiceProvider provider, IConfiguration configuration)
    // {
    //     var memoryOptions = provider.GetRequiredService<IOptions<KernelMemoryConfig>>().Value;

    //     switch (memoryOptions.Retrieval.EmbeddingGeneratorType)
    //     {
    //         case string x when x.Equals("AzureOpenAI", StringComparison.OrdinalIgnoreCase):
    //         case string y when y.Equals("AzureOpenAIEmbedding", StringComparison.OrdinalIgnoreCase):
    //             var azureAIOptions = memoryOptions.GetServiceConfig<AzureOpenAIConfig>(configuration, "AzureOpenAIEmbedding");
    //             return
    //                 new ChatArchiveEmbeddingConfig
    //                 {
    //                     AIService = ChatArchiveEmbeddingConfig.AIServiceType.AzureOpenAIEmbedding,
    //                     DeploymentOrModelId = azureAIOptions.Deployment,
    //                 };

    //         case string x when x.Equals("OpenAI", StringComparison.OrdinalIgnoreCase):
    //             var openAIOptions = memoryOptions.GetServiceConfig<OpenAIConfig>(configuration, "OpenAI");
    //             return
    //                 new ChatArchiveEmbeddingConfig
    //                 {
    //                     AIService = ChatArchiveEmbeddingConfig.AIServiceType.OpenAI,
    //                     DeploymentOrModelId = openAIOptions.EmbeddingModel,
    //                 };

    //         default:
    //             throw new ArgumentException($"Invalid {nameof(memoryOptions.Retrieval.EmbeddingGeneratorType)} value in 'KernelMemory' settings.");
    //     }
    // }
}
