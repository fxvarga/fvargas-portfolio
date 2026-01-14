using System.Text.Json;
using AgentChat.Infrastructure;
using AgentChat.Shared.Contracts;
using AgentChat.Tools.BuiltInTools;
using AgentChat.Tools.FinanceTools;
using AgentChat.Tools.Workers;

// Finance Knowledge Base and Data Lake services
using AgentChat.FinanceKnowledge.Services;
using AgentChat.FinanceKnowledge.Tools;
using AgentChat.FinanceDataLake.Services;
using AgentChat.FinanceDataLake.Tools;

// Portfolio Agent services and tools
using AgentChat.PortfolioAgent;

// Elasticsearch
using Elastic.Clients.Elasticsearch;
using FV.Domain.Interfaces;
using FV.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAgentChatInfrastructure(builder.Configuration);
builder.Services.AddHttpClient();

// ============================================
// Elasticsearch & Search Services (read-only)
// ============================================
// Required for Portfolio Agent tools
// Note: We only register the search service, not the background indexer
// The main portfolio API handles indexing; tools just query
var elasticsearchUrl = builder.Configuration["Elasticsearch:Url"]
    ?? Environment.GetEnvironmentVariable("ELASTICSEARCH_URL")
    ?? "http://localhost:9200";

builder.Services.AddSingleton<ElasticsearchClient>(sp =>
{
    var settings = new ElasticsearchClientSettings(new Uri(elasticsearchUrl))
        .DisableDirectStreaming();
    return new ElasticsearchClient(settings);
});

builder.Services.AddSingleton<ISearchService>(sp =>
{
    var client = sp.GetRequiredService<ElasticsearchClient>();
    var logger = sp.GetRequiredService<ILogger<ElasticsearchService>>();
    return new ElasticsearchService(client, logger);
});

// Register core services for Finance tools
builder.Services.AddSingleton<IKnowledgeBaseService, KnowledgeBaseService>();
builder.Services.AddSingleton<IDataLakeService, DataLakeService>();

// ============================================
// Portfolio Agent Services and Tools
// ============================================
builder.Services.AddPortfolioAgent();
builder.Services.AddPortfolioAgentTools();

// ============================================
// Built-in Tools
// ============================================
builder.Services.AddSingleton<ITool, WebSearchTool>();
builder.Services.AddSingleton<ITool, FileWriteTool>();
builder.Services.AddSingleton<ITool, CodeExecutionTool>();

// ============================================
// Finance Knowledge Base Tools (10 tools)
// ============================================
// Procedure tools
builder.Services.AddSingleton<ITool, ProcedureSearchTool>();
builder.Services.AddSingleton<ITool, ProcedureGetTool>();

// Standard tools
builder.Services.AddSingleton<ITool, StandardSearchTool>();
builder.Services.AddSingleton<ITool, StandardGetTool>();

// Policy tools
builder.Services.AddSingleton<ITool, PolicySearchTool>();
builder.Services.AddSingleton<ITool, PolicyGetTool>();
builder.Services.AddSingleton<ITool, PolicyCheckTool>();

// Recommendation tools
builder.Services.AddSingleton<ITool, TreatmentRecommendationTool>();
builder.Services.AddSingleton<ITool, KnowledgeBaseListTool>();

// ============================================
// Finance Data Lake Tools (6 tools)
// ============================================
builder.Services.AddSingleton<ITool, GlBalanceQueryTool>();
builder.Services.AddSingleton<ITool, FixedAssetQueryTool>();
builder.Services.AddSingleton<ITool, LeaseQueryTool>();
builder.Services.AddSingleton<ITool, IntercompanyQueryTool>();
builder.Services.AddSingleton<ITool, FxRateQueryTool>();
builder.Services.AddSingleton<ITool, VarianceAnalysisTool>();

// ============================================
// Finance System of Record API Tools (15 tools)
// ============================================
// Journal Entry tools
builder.Services.AddSingleton<ITool, SorJournalEntryCreateTool>();
builder.Services.AddSingleton<ITool, SorJournalEntryQueryTool>();
builder.Services.AddSingleton<ITool, SorJournalEntrySubmitTool>();
builder.Services.AddSingleton<ITool, SorJournalEntryPostTool>();

// Close Task tools
builder.Services.AddSingleton<ITool, SorCloseTaskQueryTool>();
builder.Services.AddSingleton<ITool, SorCloseStatusGetTool>();
builder.Services.AddSingleton<ITool, SorCloseTaskCompleteTool>();

// Reconciliation tools
builder.Services.AddSingleton<ITool, SorReconciliationQueryTool>();
builder.Services.AddSingleton<ITool, SorReconciliationCreateTool>();

// Fiscal Period tools
builder.Services.AddSingleton<ITool, SorFiscalPeriodGetTool>();
builder.Services.AddSingleton<ITool, SorFiscalPeriodSoftCloseTool>();

// Approval tools
builder.Services.AddSingleton<ITool, SorApprovalQueryTool>();
builder.Services.AddSingleton<ITool, SorApprovalPendingTool>();

// ============================================
// Excel Support Document Tools (3 tools)
// ============================================
builder.Services.AddSingleton<ITool, ExcelTemplateSearchTool>();
builder.Services.AddSingleton<ITool, ExcelTemplateGenerateTool>();
builder.Services.AddSingleton<ITool, ExcelSupportDocCreateTool>();

// Register tool registry and executor
builder.Services.AddSingleton<IToolRegistry, ToolRegistry>();
builder.Services.AddSingleton<IToolExecutor, ToolExecutor>();

// Background worker for queue-based tool execution
builder.Services.AddHostedService<ToolExecutionWorker>();

var app = builder.Build();

// Log registered tools on startup
var toolRegistry = app.Services.GetRequiredService<IToolRegistry>();
var tools = toolRegistry.GetAllTools();
Console.WriteLine($"Registered {tools.Count} tools:");
foreach (var tool in tools.OrderBy(t => t.Category).ThenBy(t => t.Name))
{
    Console.WriteLine($"  [{tool.Category}] {tool.Name} - {tool.RiskTier}");
}

// ============================================
// HTTP Endpoints for Tool Testing
// ============================================

app.MapGet("/health", () => Results.Ok(new { status = "healthy", tools = tools.Count }));

app.MapPost("/api/tools/{toolName}/test", async (
    string toolName,
    HttpRequest request,
    IToolExecutor toolExecutor,
    CancellationToken cancellationToken) =>
{
    // Parse JSON body
    JsonElement args;
    try
    {
        using var doc = await JsonDocument.ParseAsync(request.Body, cancellationToken: cancellationToken);
        args = doc.RootElement.Clone();
    }
    catch (JsonException)
    {
        args = JsonDocument.Parse("{}").RootElement;
    }

    // Get tenant ID from header (for testing, use a default)
    var tenantId = request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader)
        ? Guid.Parse(tenantHeader.ToString())
        : Guid.Parse("11111111-1111-1111-1111-111111111111");

    // Create a test execution context
    var context = new ToolExecutionContext
    {
        RunId = Guid.NewGuid(),
        StepId = Guid.NewGuid(),
        ToolCallId = Guid.NewGuid(),
        TenantId = tenantId,
        UserId = Guid.Empty, // Test user
        IdempotencyKey = $"test-{Guid.NewGuid()}",
        CorrelationId = Guid.NewGuid()
    };

    var result = await toolExecutor.ExecuteAsync(toolName, args, context, cancellationToken);

    return Results.Ok(new
    {
        success = result.Success,
        result = result.Result,
        error = result.Error,
        durationMs = result.Duration.TotalMilliseconds,
        artifacts = result.Artifacts
    });
});

app.Run();
