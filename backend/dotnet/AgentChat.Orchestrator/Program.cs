using AgentChat.Infrastructure;
using AgentChat.Orchestrator;
using AgentChat.Orchestrator.Workers;
using AgentChat.Shared.Contracts;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddAgentChatInfrastructure(builder.Configuration);

// Configure orchestrator options
builder.Services.Configure<OrchestratorOptions>(builder.Configuration.GetSection("Orchestrator"));

// Register static tool registry for tool definitions (used in run orchestration)
builder.Services.AddSingleton<IToolRegistry, StaticToolRegistry>();

builder.Services.AddHostedService<OrchestratorWorker>();

var host = builder.Build();
host.Run();
