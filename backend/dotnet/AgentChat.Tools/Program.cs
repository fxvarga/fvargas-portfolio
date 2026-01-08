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

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddAgentChatInfrastructure(builder.Configuration);
builder.Services.AddHttpClient();

// Register core services for Finance tools
builder.Services.AddSingleton<IKnowledgeBaseService, KnowledgeBaseService>();
builder.Services.AddSingleton<IDataLakeService, DataLakeService>();

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
// Finance Data Lake Tools (5 tools)
// ============================================
builder.Services.AddSingleton<ITool, GlBalanceQueryTool>();
builder.Services.AddSingleton<ITool, FixedAssetQueryTool>();
builder.Services.AddSingleton<ITool, LeaseQueryTool>();
builder.Services.AddSingleton<ITool, IntercompanyQueryTool>();
builder.Services.AddSingleton<ITool, FxRateQueryTool>();

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

builder.Services.AddHostedService<ToolExecutionWorker>();

var host = builder.Build();

// Log registered tools on startup
var toolRegistry = host.Services.GetRequiredService<IToolRegistry>();
var tools = toolRegistry.GetAllTools();
Console.WriteLine($"Registered {tools.Count} tools:");
foreach (var tool in tools.OrderBy(t => t.Category).ThenBy(t => t.Name))
{
    Console.WriteLine($"  [{tool.Category}] {tool.Name} - {tool.RiskTier}");
}

host.Run();
