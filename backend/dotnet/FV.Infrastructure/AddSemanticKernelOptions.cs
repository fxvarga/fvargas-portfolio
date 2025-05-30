// Copyright (c) Microsoft. All rights reserved.

using System.Configuration;
using System.Reflection;
using FV.Infrastructure.Interfaces;
using FV.Infrastructure.Models;
using FV.Infrastructure.Options;
using FV.Infrastructure.Persistence.ChatMemoryStorage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.KernelMemory;
using Path = System.IO.Path;

namespace FV.Infrastructure;

/// <summary>
/// Extension methods for <see cref="IServiceCollection"/>.
/// Add options and services for Chat Copilot.
/// </summary>
public static class ChatServiceExtensions
{
    /// <summary>
    /// Parse configuration into options.
    /// </summary>
    public static IServiceCollection AddSemanticKernelOptions(this IServiceCollection services, Microsoft.Extensions.Configuration.ConfigurationManager configuration)
    {
        AddOptions<ChatServiceOptions>(ChatServiceOptions.PropertyName);

        AddOptions<ChatAuthenticationOptions>(ChatAuthenticationOptions.PropertyName);

        AddOptions<ChatStoreOptions>(ChatStoreOptions.PropertyName);

        AddOptions<DocumentMemoryOptions>(DocumentMemoryOptions.PropertyName);

        AddOptions<PromptsOptions>(PromptsOptions.PropertyName);

        AddOptions<ContentSafetyOptions>(ContentSafetyOptions.PropertyName);

        AddOptions<KernelMemoryConfig>(MemoryConfiguration.KernelMemorySection);

        AddOptions<MsGraphOboPluginOptions>(MsGraphOboPluginOptions.PropertyName);

        return services;

        void AddOptions<TOptions>(string propertyName)
            where TOptions : class
        {
            services.AddOptions<TOptions>(configuration.GetSection(propertyName));
        }
    }

    internal static void AddOptions<TOptions>(this IServiceCollection services, IConfigurationSection section)
        where TOptions : class
    {
        services.AddOptions<TOptions>()
            .Bind(section)
            .ValidateDataAnnotations()
            .ValidateOnStart()
            .PostConfigure(TrimStringProperties);
    }

    public static IServiceCollection AddPersistentChatStore(this IServiceCollection services)
    {
        IChatStorageContext<ChatSession> chatSessionStorageContext;
        ICopilotChatMessageStorageContext chatMessageStorageContext;
        IChatStorageContext<MemorySource> chatMemorySourceStorageContext;
        IChatStorageContext<ChatParticipant> chatParticipantStorageContext;

        ChatStoreOptions chatStoreConfig = services.BuildServiceProvider().GetRequiredService<IOptions<ChatStoreOptions>>().Value;

        switch (chatStoreConfig.Type)
        {
            case ChatStoreOptions.ChatStoreType.Volatile:
                {
                    chatSessionStorageContext = new VolatileContext<ChatSession>();
                    chatMessageStorageContext = new VolatileCopilotChatMessageContext();
                    chatMemorySourceStorageContext = new VolatileContext<MemorySource>();
                    chatParticipantStorageContext = new VolatileContext<ChatParticipant>();
                    break;
                }

            case ChatStoreOptions.ChatStoreType.Filesystem:
                {
                    if (chatStoreConfig.Filesystem == null)
                    {
                        throw new InvalidOperationException("ChatStore:Filesystem is required when ChatStore:Type is 'Filesystem'");
                    }

                    string fullPath = System.IO.Path.GetFullPath(chatStoreConfig.Filesystem.FilePath);
                    string directory = Path.GetDirectoryName(fullPath) ?? string.Empty;
                    chatSessionStorageContext = new FileSystemContext<ChatSession>(
                        new FileInfo(Path.Combine(directory, $"{Path.GetFileNameWithoutExtension(fullPath)}_sessions{Path.GetExtension(fullPath)}")));
                    chatMessageStorageContext = new FileSystemCopilotChatMessageContext(
                        new FileInfo(Path.Combine(directory, $"{Path.GetFileNameWithoutExtension(fullPath)}_messages{Path.GetExtension(fullPath)}")));
                    chatMemorySourceStorageContext = new FileSystemContext<MemorySource>(
                        new FileInfo(Path.Combine(directory, $"{Path.GetFileNameWithoutExtension(fullPath)}_memorysources{Path.GetExtension(fullPath)}")));
                    chatParticipantStorageContext = new FileSystemContext<ChatParticipant>(
                        new FileInfo(Path.Combine(directory, $"{Path.GetFileNameWithoutExtension(fullPath)}_participants{Path.GetExtension(fullPath)}")));
                    break;
                }

            //             case ChatStoreOptions.ChatStoreType.Cosmos:
            //             {
            //                 if (chatStoreConfig.Cosmos == null)
            //                 {
            //                     throw new InvalidOperationException("ChatStore:Cosmos is required when ChatStore:Type is 'Cosmos'");
            //                 }
            // #pragma warning disable CA2000 // Dispose objects before losing scope - objects are singletons for the duration of the process and disposed when the process exits.
            //                 chatSessionStorageContext = new CosmosDbContext<ChatSession>(
            //                     chatStoreConfig.Cosmos.ConnectionString, chatStoreConfig.Cosmos.Database, chatStoreConfig.Cosmos.ChatSessionsContainer);
            //                 chatMessageStorageContext = new CosmosDbCopilotChatMessageContext(
            //                     chatStoreConfig.Cosmos.ConnectionString, chatStoreConfig.Cosmos.Database, chatStoreConfig.Cosmos.ChatMessagesContainer);
            //                 chatMemorySourceStorageContext = new CosmosDbContext<MemorySource>(
            //                     chatStoreConfig.Cosmos.ConnectionString, chatStoreConfig.Cosmos.Database, chatStoreConfig.Cosmos.ChatMemorySourcesContainer);
            //                 chatParticipantStorageContext = new CosmosDbContext<ChatParticipant>(
            //                     chatStoreConfig.Cosmos.ConnectionString, chatStoreConfig.Cosmos.Database, chatStoreConfig.Cosmos.ChatParticipantsContainer);
            // #pragma warning restore CA2000 // Dispose objects before losing scope
            //                 break;
            //             }

            default:
                {
                    throw new InvalidOperationException(
                        "Invalid 'ChatStore' setting 'chatStoreConfig.Type'.");
                }
        }

        services.AddSingleton<ChatSessionRepository>(new ChatSessionRepository(chatSessionStorageContext));
        services.AddSingleton<ChatMessageRepository>(new ChatMessageRepository(chatMessageStorageContext));
        services.AddSingleton<ChatMemorySourceRepository>(new ChatMemorySourceRepository(chatMemorySourceStorageContext));
        services.AddSingleton<ChatParticipantRepository>(new ChatParticipantRepository(chatParticipantStorageContext));

        return services;
    }

    // /// <summary>
    // /// Add authorization services
    // /// </summary>
    // public static IServiceCollection AddChatCopilotAuthorization(this IServiceCollection services)
    // {
    //     return services.AddScoped<IAuthorizationHandler, ChatParticipantAuthorizationHandler>()
    //         .AddAuthorizationCore(options =>
    //         {
    //             options.DefaultPolicy = new AuthorizationPolicyBuilder()
    //                 .RequireAuthenticatedUser()
    //                 .Build();
    //             options.AddPolicy(AuthPolicyName.RequireChatParticipant, builder =>
    //             {
    //                 builder.RequireAuthenticatedUser()
    //                     .AddRequirements(new ChatParticipantRequirement());
    //             });
    //         });
    // }

    // /// <summary>
    // /// Add authentication services
    // /// </summary>
    // public static IServiceCollection AddChatCopilotAuthentication(this IServiceCollection services, IConfiguration configuration)
    // {
    //     services.AddScoped<IAuthInfo, AuthInfo>();
    //     var config = services.BuildServiceProvider().GetRequiredService<IOptions<ChatAuthenticationOptions>>().Value;
    //     switch (config.Type)
    //     {
    //         case ChatAuthenticationOptions.AuthenticationType.AzureAd:
    //             services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    //                 .AddMicrosoftIdentityWebApi(configuration.GetSection($"{ChatAuthenticationOptions.PropertyName}:AzureAd"));
    //             break;

    //         case ChatAuthenticationOptions.AuthenticationType.None:
    //             services.AddAuthentication(PassThroughAuthenticationHandler.AuthenticationScheme)
    //                 .AddScheme<AuthenticationSchemeOptions, PassThroughAuthenticationHandler>(
    //                     authenticationScheme: PassThroughAuthenticationHandler.AuthenticationScheme,
    //                     configureOptions: null);
    //             break;

    //         default:
    //             throw new InvalidOperationException($"Invalid authentication type '{config.Type}'.");
    //     }

    //     return services;
    // }

    // /// <summary>
    // /// Trim all string properties, recursively.
    // /// </summary>
    private static void TrimStringProperties<T>(T options) where T : class
    {
        Queue<object> targets = new();
        targets.Enqueue(options);

        while (targets.Count > 0)
        {
            object target = targets.Dequeue();
            Type targetType = target.GetType();
            foreach (PropertyInfo property in targetType.GetProperties())
            {
                // Skip enumerations
                if (property.PropertyType.IsEnum)
                {
                    continue;
                }

                // Skip index properties
                if (property.GetIndexParameters().Length == 0)
                {
                    continue;
                }

                // Property is a built-in type, readable, and writable.
                if (property.PropertyType.Namespace == "System" &&
                    property.CanRead &&
                    property.CanWrite)
                {
                    // Property is a non-null string.
                    if (property.PropertyType == typeof(string) &&
                        property.GetValue(target) != null)
                    {
                        property.SetValue(target, property.GetValue(target)!.ToString()!.Trim());
                    }
                }
                else
                {
                    // Property is a non-built-in and non-enum type - queue it for processing.
                    if (property.GetValue(target) != null)
                    {
                        targets.Enqueue(property.GetValue(target)!);
                    }
                }
            }
        }
    }

}
