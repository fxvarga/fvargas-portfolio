using AgentChat.Infrastructure;
using AgentChat.Infrastructure.Configuration;
using AgentChat.ModelGateway.LlmClients;
using AgentChat.ModelGateway.Workers;
using AgentChat.Shared.Contracts;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddAgentChatInfrastructure(builder.Configuration);

// Configure OpenAI-compatible options
builder.Services.Configure<OpenAiCompatibleOptions>(
    builder.Configuration.GetSection(OpenAiCompatibleOptions.SectionName));

// Register LLM clients
builder.Services.AddSingleton<HttpClient>();
builder.Services.AddSingleton<AzureOpenAiLlmClient>();
builder.Services.AddSingleton<OpenAiCompatibleLlmClient>();
builder.Services.AddSingleton<LlmClientFactory>();

// Register static tool registry for tool definitions (used in OpenAI function calls)
builder.Services.AddSingleton<IToolRegistry, StaticToolRegistry>();

builder.Services.AddHostedService<ModelGatewayWorker>();

var host = builder.Build();

// Log configuration status at startup
var factory = host.Services.GetRequiredService<LlmClientFactory>();
var logger = host.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation(factory.GetConfigurationStatus());

host.Run();
