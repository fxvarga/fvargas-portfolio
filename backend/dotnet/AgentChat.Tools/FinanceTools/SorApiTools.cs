using System.Net.Http.Json;
using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;

namespace AgentChat.Tools.FinanceTools;

/// <summary>
/// Base class for SoR API tools that make HTTP calls to the Finance API service.
/// </summary>
public abstract class SorApiToolBase : ITool
{
    protected readonly HttpClient HttpClient;
    protected readonly string BaseUrl;

    protected SorApiToolBase(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        HttpClient = httpClientFactory.CreateClient("FinanceApi");
        BaseUrl = configuration["FinanceApi:BaseUrl"]?.TrimEnd('/') ?? "http://localhost:5102";
    }

    public abstract ToolDefinition Definition { get; }
    public abstract Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default);

    protected static ToolExecutionResult CreateErrorResult(string message, TimeSpan duration)
    {
        var errorResult = JsonSerializer.SerializeToElement(new { success = false, error = message });
        return ToolExecutionResult.Ok(errorResult, duration);
    }
}

#region Journal Entry Tools

/// <summary>
/// Create a journal entry in the System of Record.
/// </summary>
public class SorJournalEntryCreateTool : SorApiToolBase, IRequiresApproval
{
    public SorJournalEntryCreateTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_journal_entry_create",
        Description = "Create a journal entry in the Finance System of Record. " +
                      "Use for recording depreciation, accruals, adjustments, and other accounting entries. " +
                      "Returns the created entry with ID and entry number.",
        Category = "finance_sor",
        RiskTier = RiskTier.High,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code (e.g., US01, UK01)" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year" },
                "fiscal_period": { "type": "integer", "description": "Fiscal period (1-13)" },
                "effective_date": { "type": "string", "description": "Effective date (YYYY-MM-DD)" },
                "entry_type": { "type": "string", "description": "Entry type: STANDARD, REVERSING, RECURRING, ADJUSTMENT, RECLASSIFICATION" },
                "description": { "type": "string", "description": "Description of the journal entry" },
                "lines": { "type": "array", "description": "Array of line items with account_number, account_name, debit_amount, credit_amount, currency, cost_center" },
                "created_by": { "type": "string", "description": "User creating the entry" },
                "source_system": { "type": "string", "description": "Source system (e.g., MANUAL, AUTOMATED)" },
                "procedure_id": { "type": "string", "description": "Related procedure ID" }
            },
            "required": ["entity_code", "fiscal_year", "fiscal_period", "effective_date", "entry_type", "description", "lines", "created_by"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "journal_entry", "create", "write"]
    };

    public string GenerateSummary(JsonElement args)
    {
        var entityCode = args.TryGetProperty("entity_code", out var ec) ? ec.GetString() : "unknown";
        var description = args.TryGetProperty("description", out var desc) ? desc.GetString() : "journal entry";
        return $"Create journal entry for {entityCode}: {description}";
    }

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var request = new
            {
                EntityCode = args.GetProperty("entity_code").GetString(),
                FiscalYear = args.GetProperty("fiscal_year").GetInt32(),
                FiscalPeriod = args.GetProperty("fiscal_period").GetInt32(),
                EffectiveDate = DateTime.Parse(args.GetProperty("effective_date").GetString()!),
                EntryType = args.GetProperty("entry_type").GetString(),
                Description = args.GetProperty("description").GetString(),
                Lines = args.GetProperty("lines"),
                CreatedBy = args.GetProperty("created_by").GetString(),
                SourceSystem = args.TryGetProperty("source_system", out var ss) ? ss.GetString() : "AI_ASSISTANT",
                ProcedureId = args.TryGetProperty("procedure_id", out var pi) ? pi.GetString() : null
            };

            var response = await HttpClient.PostAsJsonAsync($"{BaseUrl}/api/journalentries", request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Query journal entries from the System of Record.
/// </summary>
public class SorJournalEntryQueryTool : SorApiToolBase
{
    public SorJournalEntryQueryTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_journal_entry_query",
        Description = "Query journal entries from the Finance System of Record. " +
                      "Filter by entity, fiscal period, status, or entry type.",
        Category = "finance_sor",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code filter" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year filter" },
                "fiscal_period": { "type": "integer", "description": "Fiscal period filter" },
                "status": { "type": "string", "description": "Status: DRAFT, PENDING_APPROVAL, APPROVED, POSTED, REVERSED" },
                "entry_type": { "type": "string", "description": "Entry type filter" }
            }
        }
        """).RootElement,
        Tags = ["finance", "sor", "journal_entry", "query", "read-only"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var queryParams = new List<string>();
            if (args.TryGetProperty("entity_code", out var ec)) queryParams.Add($"entityCode={ec.GetString()}");
            if (args.TryGetProperty("fiscal_year", out var fy)) queryParams.Add($"fiscalYear={fy.GetInt32()}");
            if (args.TryGetProperty("fiscal_period", out var fp)) queryParams.Add($"fiscalPeriod={fp.GetInt32()}");
            if (args.TryGetProperty("status", out var st)) queryParams.Add($"status={st.GetString()}");
            if (args.TryGetProperty("entry_type", out var et)) queryParams.Add($"entryType={et.GetString()}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var response = await HttpClient.GetAsync($"{BaseUrl}/api/journalentries{queryString}", cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var entries = JsonSerializer.Deserialize<JsonElement>(content);

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                count = entries.GetArrayLength(),
                entries
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Submit a journal entry for approval.
/// </summary>
public class SorJournalEntrySubmitTool : SorApiToolBase
{
    public SorJournalEntrySubmitTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_journal_entry_submit",
        Description = "Submit a journal entry for approval workflow.",
        Category = "finance_sor",
        RiskTier = RiskTier.Medium,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "id": { "type": "string", "description": "Journal entry ID" },
                "submitted_by": { "type": "string", "description": "User submitting the entry" }
            },
            "required": ["id", "submitted_by"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "journal_entry", "submit", "workflow"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var id = args.GetProperty("id").GetString();
            var submittedBy = args.GetProperty("submitted_by").GetString();

            var request = new { status = "PENDING_APPROVAL", updatedBy = submittedBy };
            var response = await HttpClient.PatchAsJsonAsync($"{BaseUrl}/api/journalentries/{id}/status", request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Post a journal entry to the general ledger.
/// </summary>
public class SorJournalEntryPostTool : SorApiToolBase, IRequiresApproval
{
    public SorJournalEntryPostTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_journal_entry_post",
        Description = "Post an approved journal entry to the general ledger. This action is irreversible.",
        Category = "finance_sor",
        RiskTier = RiskTier.Critical,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "id": { "type": "string", "description": "Journal entry ID" },
                "posted_by": { "type": "string", "description": "User posting the entry" }
            },
            "required": ["id", "posted_by"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "journal_entry", "post", "critical"]
    };

    public string GenerateSummary(JsonElement args)
    {
        var id = args.TryGetProperty("id", out var idEl) ? idEl.GetString() : "unknown";
        return $"Post journal entry {id} to general ledger";
    }

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var id = args.GetProperty("id").GetString();
            var postedBy = args.GetProperty("posted_by").GetString();

            var request = new { postedBy };
            var response = await HttpClient.PostAsJsonAsync($"{BaseUrl}/api/journalentries/{id}/post", request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

#endregion

#region Close Task Tools

/// <summary>
/// Query close tasks for a period.
/// </summary>
public class SorCloseTaskQueryTool : SorApiToolBase
{
    public SorCloseTaskQueryTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_close_task_query",
        Description = "Query close tasks for a fiscal period. " +
                      "Returns task status, assignments, and blocking issues.",
        Category = "finance_sor",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code filter" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year filter" },
                "fiscal_period": { "type": "integer", "description": "Fiscal period filter" },
                "status": { "type": "string", "description": "Status: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED" },
                "category": { "type": "string", "description": "Category: SUBLEDGER_CLOSE, GL_CLOSE, RECONCILIATION, REPORTING, CONSOLIDATION" },
                "assigned_to": { "type": "string", "description": "Assigned to filter" }
            }
        }
        """).RootElement,
        Tags = ["finance", "sor", "close", "query", "read-only"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var queryParams = new List<string>();
            if (args.TryGetProperty("entity_code", out var ec)) queryParams.Add($"entityCode={ec.GetString()}");
            if (args.TryGetProperty("fiscal_year", out var fy)) queryParams.Add($"fiscalYear={fy.GetInt32()}");
            if (args.TryGetProperty("fiscal_period", out var fp)) queryParams.Add($"fiscalPeriod={fp.GetInt32()}");
            if (args.TryGetProperty("status", out var st)) queryParams.Add($"status={st.GetString()}");
            if (args.TryGetProperty("category", out var ct)) queryParams.Add($"category={ct.GetString()}");
            if (args.TryGetProperty("assigned_to", out var at)) queryParams.Add($"assignedTo={at.GetString()}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var response = await HttpClient.GetAsync($"{BaseUrl}/api/closetasks{queryString}", cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var tasks = JsonSerializer.Deserialize<JsonElement>(content);

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                count = tasks.GetArrayLength(),
                tasks
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Get close status summary for a period.
/// </summary>
public class SorCloseStatusGetTool : SorApiToolBase
{
    public SorCloseStatusGetTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_close_status_get",
        Description = "Get the overall close status for a fiscal period. " +
                      "Returns completion percentage, blocking issues, and task counts.",
        Category = "finance_sor",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year" },
                "fiscal_period": { "type": "integer", "description": "Fiscal period" }
            },
            "required": ["entity_code", "fiscal_year", "fiscal_period"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "close", "status", "read-only"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var entityCode = args.GetProperty("entity_code").GetString();
            var fiscalYear = args.GetProperty("fiscal_year").GetInt32();
            var fiscalPeriod = args.GetProperty("fiscal_period").GetInt32();

            var response = await HttpClient.GetAsync($"{BaseUrl}/api/closetasks/status/{entityCode}/{fiscalYear}/{fiscalPeriod}", cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Complete a close task.
/// </summary>
public class SorCloseTaskCompleteTool : SorApiToolBase
{
    public SorCloseTaskCompleteTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_close_task_complete",
        Description = "Mark a close task as completed.",
        Category = "finance_sor",
        RiskTier = RiskTier.Medium,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "task_id": { "type": "string", "description": "Close task ID" },
                "completed_by": { "type": "string", "description": "User completing the task" },
                "notes": { "type": "string", "description": "Completion notes" }
            },
            "required": ["task_id", "completed_by"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "close", "complete", "workflow"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var taskId = args.GetProperty("task_id").GetString();
            var completedBy = args.GetProperty("completed_by").GetString();
            var notes = args.TryGetProperty("notes", out var n) ? n.GetString() : null;

            var request = new { completedBy, notes };
            var response = await HttpClient.PostAsJsonAsync($"{BaseUrl}/api/closetasks/{taskId}/complete", request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

#endregion

#region Reconciliation Tools

/// <summary>
/// Query reconciliations from the System of Record.
/// </summary>
public class SorReconciliationQueryTool : SorApiToolBase
{
    public SorReconciliationQueryTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_reconciliation_query",
        Description = "Query reconciliations from the Finance System of Record. " +
                      "Filter by entity, period, status, or type.",
        Category = "finance_sor",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code filter" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year filter" },
                "fiscal_period": { "type": "integer", "description": "Fiscal period filter" },
                "status": { "type": "string", "description": "Status: OPEN, IN_PROGRESS, RECONCILED, EXCEPTION, APPROVED" },
                "reconciliation_type": { "type": "string", "description": "Type: BANK, SUBLEDGER_TO_GL, INTERCOMPANY, INVENTORY, FIXED_ASSET" }
            }
        }
        """).RootElement,
        Tags = ["finance", "sor", "reconciliation", "query", "read-only"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var queryParams = new List<string>();
            if (args.TryGetProperty("entity_code", out var ec)) queryParams.Add($"entityCode={ec.GetString()}");
            if (args.TryGetProperty("fiscal_year", out var fy)) queryParams.Add($"fiscalYear={fy.GetInt32()}");
            if (args.TryGetProperty("fiscal_period", out var fp)) queryParams.Add($"fiscalPeriod={fp.GetInt32()}");
            if (args.TryGetProperty("status", out var st)) queryParams.Add($"status={st.GetString()}");
            if (args.TryGetProperty("reconciliation_type", out var rt)) queryParams.Add($"reconciliationType={rt.GetString()}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var response = await HttpClient.GetAsync($"{BaseUrl}/api/reconciliations{queryString}", cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var recs = JsonSerializer.Deserialize<JsonElement>(content);

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                count = recs.GetArrayLength(),
                reconciliations = recs
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Create a reconciliation record.
/// </summary>
public class SorReconciliationCreateTool : SorApiToolBase
{
    public SorReconciliationCreateTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_reconciliation_create",
        Description = "Create a reconciliation record in the Finance System of Record.",
        Category = "finance_sor",
        RiskTier = RiskTier.Medium,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year" },
                "fiscal_period": { "type": "integer", "description": "Fiscal period" },
                "reconciliation_type": { "type": "string", "description": "Type: BANK, SUBLEDGER_TO_GL, INTERCOMPANY, INVENTORY, FIXED_ASSET" },
                "account_number": { "type": "string", "description": "Account number being reconciled" },
                "account_name": { "type": "string", "description": "Account name" },
                "gl_balance": { "type": "number", "description": "GL balance amount" },
                "subledger_balance": { "type": "number", "description": "Subledger or external balance amount" },
                "prepared_by": { "type": "string", "description": "User preparing the reconciliation" },
                "due_date": { "type": "string", "description": "Due date (YYYY-MM-DD)" }
            },
            "required": ["entity_code", "fiscal_year", "fiscal_period", "reconciliation_type", "account_number", "account_name", "gl_balance", "subledger_balance", "prepared_by", "due_date"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "reconciliation", "create", "write"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var request = new
            {
                EntityCode = args.GetProperty("entity_code").GetString(),
                FiscalYear = args.GetProperty("fiscal_year").GetInt32(),
                FiscalPeriod = args.GetProperty("fiscal_period").GetInt32(),
                ReconciliationType = args.GetProperty("reconciliation_type").GetString(),
                AccountNumber = args.GetProperty("account_number").GetString(),
                AccountName = args.GetProperty("account_name").GetString(),
                GlBalance = args.GetProperty("gl_balance").GetDecimal(),
                SubledgerBalance = args.GetProperty("subledger_balance").GetDecimal(),
                PreparedBy = args.GetProperty("prepared_by").GetString(),
                DueDate = DateTime.Parse(args.GetProperty("due_date").GetString()!)
            };

            var response = await HttpClient.PostAsJsonAsync($"{BaseUrl}/api/reconciliations", request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

#endregion

#region Fiscal Period Tools

/// <summary>
/// Get fiscal period status.
/// </summary>
public class SorFiscalPeriodGetTool : SorApiToolBase
{
    public SorFiscalPeriodGetTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_fiscal_period_get",
        Description = "Get the status of a fiscal period including subledger status, " +
                      "soft/hard close dates, and period dates.",
        Category = "finance_sor",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year" },
                "period": { "type": "integer", "description": "Fiscal period" }
            },
            "required": ["entity_code", "fiscal_year", "period"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "fiscal_period", "query", "read-only"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var entityCode = args.GetProperty("entity_code").GetString();
            var fiscalYear = args.GetProperty("fiscal_year").GetInt32();
            var period = args.GetProperty("period").GetInt32();

            var response = await HttpClient.GetAsync($"{BaseUrl}/api/fiscalperiods/{entityCode}/{fiscalYear}/{period}", cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Perform soft close on a fiscal period.
/// </summary>
public class SorFiscalPeriodSoftCloseTool : SorApiToolBase, IRequiresApproval
{
    public SorFiscalPeriodSoftCloseTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_fiscal_period_soft_close",
        Description = "Perform soft close on a fiscal period. Prevents new transactions but allows adjustments.",
        Category = "finance_sor",
        RiskTier = RiskTier.High,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code" },
                "fiscal_year": { "type": "integer", "description": "Fiscal year" },
                "period": { "type": "integer", "description": "Fiscal period" },
                "closed_by": { "type": "string", "description": "User performing the close" }
            },
            "required": ["entity_code", "fiscal_year", "period", "closed_by"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "fiscal_period", "close", "critical"]
    };

    public string GenerateSummary(JsonElement args)
    {
        var entityCode = args.TryGetProperty("entity_code", out var ec) ? ec.GetString() : "unknown";
        var fiscalYear = args.TryGetProperty("fiscal_year", out var fy) ? fy.GetInt32().ToString() : "unknown";
        var period = args.TryGetProperty("period", out var p) ? p.GetInt32().ToString() : "unknown";
        return $"Soft close fiscal period {fiscalYear}-{period} for entity {entityCode}";
    }

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var entityCode = args.GetProperty("entity_code").GetString();
            var fiscalYear = args.GetProperty("fiscal_year").GetInt32();
            var period = args.GetProperty("period").GetInt32();
            var closedBy = args.GetProperty("closed_by").GetString();

            var request = new { closedBy };
            var response = await HttpClient.PostAsJsonAsync($"{BaseUrl}/api/fiscalperiods/{entityCode}/{fiscalYear}/{period}/soft-close", request, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(content);

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

#endregion

#region Approval Tools

/// <summary>
/// Query pending approvals.
/// </summary>
public class SorApprovalQueryTool : SorApiToolBase
{
    public SorApprovalQueryTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_approval_query",
        Description = "Query approval requests in the Finance System of Record.",
        Category = "finance_sor",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": { "type": "string", "description": "Entity code filter" },
                "assigned_to": { "type": "string", "description": "Assigned to filter" },
                "status": { "type": "string", "description": "Status: PENDING, APPROVED, REJECTED, CANCELLED, ESCALATED" },
                "approval_type": { "type": "string", "description": "Type: JOURNAL_ENTRY, RECONCILIATION, CLOSE_TASK, PERIOD_CLOSE, ADJUSTMENT" }
            }
        }
        """).RootElement,
        Tags = ["finance", "sor", "approval", "query", "read-only"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var queryParams = new List<string>();
            if (args.TryGetProperty("entity_code", out var ec)) queryParams.Add($"entityCode={ec.GetString()}");
            if (args.TryGetProperty("assigned_to", out var at)) queryParams.Add($"assignedTo={at.GetString()}");
            if (args.TryGetProperty("status", out var st)) queryParams.Add($"status={st.GetString()}");
            if (args.TryGetProperty("approval_type", out var apt)) queryParams.Add($"approvalType={apt.GetString()}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var response = await HttpClient.GetAsync($"{BaseUrl}/api/approvals{queryString}", cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var approvals = JsonSerializer.Deserialize<JsonElement>(content);

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                count = approvals.GetArrayLength(),
                approvals
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Get pending approvals for a user.
/// </summary>
public class SorApprovalPendingTool : SorApiToolBase
{
    public SorApprovalPendingTool(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        : base(httpClientFactory, configuration) { }

    public override ToolDefinition Definition => new()
    {
        Name = "sor_approval_pending",
        Description = "Get pending approvals assigned to a specific user.",
        Category = "finance_sor",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "assigned_to": { "type": "string", "description": "User to get pending approvals for" }
            },
            "required": ["assigned_to"]
        }
        """).RootElement,
        Tags = ["finance", "sor", "approval", "pending", "read-only"]
    };

    public override async Task<ToolExecutionResult> ExecuteAsync(JsonElement args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            var assignedTo = args.GetProperty("assigned_to").GetString();

            var response = await HttpClient.GetAsync($"{BaseUrl}/api/approvals/pending/{assignedTo}", cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var approvals = JsonSerializer.Deserialize<JsonElement>(content);

            var result = JsonSerializer.SerializeToElement(new
            {
                success = true,
                count = approvals.GetArrayLength(),
                approvals
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return CreateErrorResult(ex.Message, DateTime.UtcNow - startTime);
        }
    }
}

#endregion
