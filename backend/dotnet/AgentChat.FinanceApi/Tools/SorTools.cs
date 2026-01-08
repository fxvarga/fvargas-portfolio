using System.ComponentModel;
using System.Net.Http.Json;
using System.Text.Json;
using AgentChat.FinanceApi.Models;

namespace AgentChat.FinanceApi.Tools;

/// <summary>
/// Custom attribute for tool names used by the AI orchestrator
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public class ToolNameAttribute : Attribute
{
    public string Name { get; }
    public ToolNameAttribute(string name) => Name = name;
}

/// <summary>
/// Tools for interacting with the Finance System of Record (SoR) API
/// These tools are used by the AI orchestrator to manage journal entries, reconciliations, approvals, etc.
/// </summary>
public class SorTools
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public SorTools(HttpClient httpClient, string baseUrl = "http://localhost:5002")
    {
        _httpClient = httpClient;
        _baseUrl = baseUrl.TrimEnd('/');
    }

    #region Journal Entry Tools

    [Description("Create a journal entry in the System of Record. Returns the created entry with ID and entry number.")]
    [ToolName("sor_journal_entry_create")]
    public async Task<object> CreateJournalEntryAsync(
        [Description("Entity code (e.g., US01, UK01)")] string entityCode,
        [Description("Fiscal year")] int fiscalYear,
        [Description("Fiscal period (1-13)")] int fiscalPeriod,
        [Description("Effective date (YYYY-MM-DD)")] string effectiveDate,
        [Description("Entry type: STANDARD, REVERSING, RECURRING, ADJUSTMENT, RECLASSIFICATION")] string entryType,
        [Description("Description of the journal entry")] string description,
        [Description("JSON array of line items with account_number, account_name, debit_amount, credit_amount, currency, cost_center")] string linesJson,
        [Description("User creating the entry")] string createdBy,
        [Description("Source system (e.g., MANUAL, AUTOMATED)")] string sourceSystem = "MANUAL",
        [Description("Reference number or ID")] string? reference = null,
        [Description("Is this a reversing entry?")] bool isReversing = false,
        [Description("Reversal date if reversing (YYYY-MM-DD)")] string? reversalDate = null,
        [Description("Related procedure ID")] string? procedureId = null)
    {
        try
        {
            var lines = JsonSerializer.Deserialize<List<JournalEntryLine>>(linesJson) ?? new List<JournalEntryLine>();
            
            var request = new CreateJournalEntryRequest
            {
                EntityCode = entityCode,
                FiscalYear = fiscalYear,
                FiscalPeriod = fiscalPeriod,
                EffectiveDate = DateTime.Parse(effectiveDate),
                EntryType = entryType,
                Description = description,
                Lines = lines,
                CreatedBy = createdBy,
                SourceSystem = sourceSystem,
                Reference = reference,
                IsReversing = isReversing,
                ReversalDate = string.IsNullOrEmpty(reversalDate) ? null : DateTime.Parse(reversalDate),
                ProcedureId = procedureId
            };

            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/journalentries", request);
            var result = await response.Content.ReadFromJsonAsync<JournalEntryResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                entry_id = result?.Entry?.Id,
                entry_number = result?.Entry?.EntryNumber,
                status = result?.Entry?.Status,
                total_debits = result?.Entry?.TotalDebits,
                total_credits = result?.Entry?.TotalCredits,
                is_balanced = result?.Entry?.IsBalanced,
                validation_errors = result?.ValidationErrors
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Query journal entries from the System of Record based on filters.")]
    [ToolName("sor_journal_entry_query")]
    public async Task<object> QueryJournalEntriesAsync(
        [Description("Entity code filter")] string? entityCode = null,
        [Description("Fiscal year filter")] int? fiscalYear = null,
        [Description("Fiscal period filter")] int? fiscalPeriod = null,
        [Description("Status filter: DRAFT, PENDING_APPROVAL, APPROVED, POSTED, REVERSED")] string? status = null,
        [Description("Entry type filter")] string? entryType = null)
    {
        try
        {
            var queryParams = new List<string>();
            if (!string.IsNullOrEmpty(entityCode)) queryParams.Add($"entityCode={entityCode}");
            if (fiscalYear.HasValue) queryParams.Add($"fiscalYear={fiscalYear}");
            if (fiscalPeriod.HasValue) queryParams.Add($"fiscalPeriod={fiscalPeriod}");
            if (!string.IsNullOrEmpty(status)) queryParams.Add($"status={status}");
            if (!string.IsNullOrEmpty(entryType)) queryParams.Add($"entryType={entryType}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var entries = await _httpClient.GetFromJsonAsync<List<JournalEntry>>($"{_baseUrl}/api/journalentries{queryString}");

            return new
            {
                success = true,
                count = entries?.Count ?? 0,
                entries = entries?.Select(e => new
                {
                    id = e.Id,
                    entry_number = e.EntryNumber,
                    entity_code = e.EntityCode,
                    fiscal_period = $"{e.FiscalYear}-{e.FiscalPeriod}",
                    entry_type = e.EntryType,
                    description = e.Description,
                    status = e.Status,
                    total_debits = e.TotalDebits,
                    total_credits = e.TotalCredits,
                    created_by = e.CreatedBy,
                    created_at = e.CreatedAt
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Get a specific journal entry by ID.")]
    [ToolName("sor_journal_entry_get")]
    public async Task<object> GetJournalEntryAsync(
        [Description("Journal entry ID")] string id)
    {
        try
        {
            var entry = await _httpClient.GetFromJsonAsync<JournalEntry>($"{_baseUrl}/api/journalentries/{id}");
            if (entry == null)
                return new { success = false, error = "Journal entry not found" };

            return new
            {
                success = true,
                entry = new
                {
                    id = entry.Id,
                    entry_number = entry.EntryNumber,
                    entity_code = entry.EntityCode,
                    fiscal_year = entry.FiscalYear,
                    fiscal_period = entry.FiscalPeriod,
                    entry_date = entry.EntryDate,
                    effective_date = entry.EffectiveDate,
                    entry_type = entry.EntryType,
                    description = entry.Description,
                    status = entry.Status,
                    lines = entry.Lines.Select(l => new
                    {
                        line_number = l.LineNumber,
                        account_number = l.AccountNumber,
                        account_name = l.AccountName,
                        debit_amount = l.DebitAmount,
                        credit_amount = l.CreditAmount,
                        currency = l.Currency,
                        cost_center = l.CostCenter
                    }),
                    total_debits = entry.TotalDebits,
                    total_credits = entry.TotalCredits,
                    is_balanced = entry.IsBalanced,
                    created_by = entry.CreatedBy,
                    approved_by = entry.ApprovedBy,
                    posted_by = entry.PostedBy
                }
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Submit a journal entry for approval.")]
    [ToolName("sor_journal_entry_submit")]
    public async Task<object> SubmitJournalEntryAsync(
        [Description("Journal entry ID")] string id,
        [Description("User submitting the entry")] string submittedBy)
    {
        try
        {
            var request = new { status = "PENDING_APPROVAL", updatedBy = submittedBy };
            var response = await _httpClient.PatchAsJsonAsync($"{_baseUrl}/api/journalentries/{id}/status", request);
            var result = await response.Content.ReadFromJsonAsync<JournalEntryResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                new_status = result?.Entry?.Status
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Post an approved journal entry to the general ledger.")]
    [ToolName("sor_journal_entry_post")]
    public async Task<object> PostJournalEntryAsync(
        [Description("Journal entry ID")] string id,
        [Description("User posting the entry")] string postedBy)
    {
        try
        {
            var request = new { postedBy };
            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/journalentries/{id}/post", request);
            var result = await response.Content.ReadFromJsonAsync<JournalEntryResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                new_status = result?.Entry?.Status,
                posted_at = result?.Entry?.PostedAt
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Reverse a posted journal entry.")]
    [ToolName("sor_journal_entry_reverse")]
    public async Task<object> ReverseJournalEntryAsync(
        [Description("Journal entry ID to reverse")] string id,
        [Description("Reversal date (YYYY-MM-DD)")] string reversalDate,
        [Description("User performing the reversal")] string reversedBy)
    {
        try
        {
            var request = new { reversalDate = DateTime.Parse(reversalDate), reversedBy };
            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/journalentries/{id}/reverse", request);
            var result = await response.Content.ReadFromJsonAsync<JournalEntryResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                reversal_entry_id = result?.Entry?.Id,
                reversal_entry_number = result?.Entry?.EntryNumber
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    #endregion

    #region Reconciliation Tools

    [Description("Create a reconciliation record in the System of Record.")]
    [ToolName("sor_reconciliation_create")]
    public async Task<object> CreateReconciliationAsync(
        [Description("Entity code")] string entityCode,
        [Description("Fiscal year")] int fiscalYear,
        [Description("Fiscal period")] int fiscalPeriod,
        [Description("Reconciliation type: BANK, SUBLEDGER_TO_GL, INTERCOMPANY, INVENTORY, FIXED_ASSET")] string reconciliationType,
        [Description("Account number being reconciled")] string accountNumber,
        [Description("Account name")] string accountName,
        [Description("GL balance amount")] decimal glBalance,
        [Description("Subledger or external balance amount")] decimal subledgerBalance,
        [Description("User preparing the reconciliation")] string preparedBy,
        [Description("Due date (YYYY-MM-DD)")] string dueDate,
        [Description("External balance (e.g., bank statement)")] decimal? externalBalance = null,
        [Description("Related procedure ID")] string? procedureId = null)
    {
        try
        {
            var request = new CreateReconciliationRequest
            {
                EntityCode = entityCode,
                FiscalYear = fiscalYear,
                FiscalPeriod = fiscalPeriod,
                ReconciliationType = reconciliationType,
                AccountNumber = accountNumber,
                AccountName = accountName,
                GlBalance = glBalance,
                SubledgerBalance = subledgerBalance,
                ExternalBalance = externalBalance,
                PreparedBy = preparedBy,
                DueDate = DateTime.Parse(dueDate),
                ProcedureId = procedureId
            };

            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/reconciliations", request);
            var result = await response.Content.ReadFromJsonAsync<ReconciliationResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                reconciliation_id = result?.Reconciliation?.Id,
                reconciliation_number = result?.Reconciliation?.ReconciliationNumber,
                variance = result?.Reconciliation?.Variance,
                status = result?.Reconciliation?.Status
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Query reconciliations from the System of Record.")]
    [ToolName("sor_reconciliation_query")]
    public async Task<object> QueryReconciliationsAsync(
        [Description("Entity code filter")] string? entityCode = null,
        [Description("Fiscal year filter")] int? fiscalYear = null,
        [Description("Fiscal period filter")] int? fiscalPeriod = null,
        [Description("Status filter: OPEN, IN_PROGRESS, RECONCILED, EXCEPTION, APPROVED")] string? status = null,
        [Description("Reconciliation type filter")] string? reconciliationType = null)
    {
        try
        {
            var queryParams = new List<string>();
            if (!string.IsNullOrEmpty(entityCode)) queryParams.Add($"entityCode={entityCode}");
            if (fiscalYear.HasValue) queryParams.Add($"fiscalYear={fiscalYear}");
            if (fiscalPeriod.HasValue) queryParams.Add($"fiscalPeriod={fiscalPeriod}");
            if (!string.IsNullOrEmpty(status)) queryParams.Add($"status={status}");
            if (!string.IsNullOrEmpty(reconciliationType)) queryParams.Add($"reconciliationType={reconciliationType}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var recs = await _httpClient.GetFromJsonAsync<List<Reconciliation>>($"{_baseUrl}/api/reconciliations{queryString}");

            return new
            {
                success = true,
                count = recs?.Count ?? 0,
                reconciliations = recs?.Select(r => new
                {
                    id = r.Id,
                    reconciliation_number = r.ReconciliationNumber,
                    entity_code = r.EntityCode,
                    fiscal_period = $"{r.FiscalYear}-{r.FiscalPeriod}",
                    type = r.ReconciliationType,
                    account = $"{r.AccountNumber} - {r.AccountName}",
                    gl_balance = r.GlBalance,
                    subledger_balance = r.SubledgerBalance,
                    variance = r.Variance,
                    status = r.Status,
                    is_reconciled = r.IsReconciled,
                    due_date = r.DueDate
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Add a reconciling item to explain a variance.")]
    [ToolName("sor_reconciliation_add_item")]
    public async Task<object> AddReconcilingItemAsync(
        [Description("Reconciliation ID")] string reconciliationId,
        [Description("Item type: TIMING, ADJUSTMENT, ERROR, OTHER")] string itemType,
        [Description("Description of the reconciling item")] string description,
        [Description("Amount of the reconciling item")] decimal amount,
        [Description("Expected clear date (YYYY-MM-DD)")] string? expectedClearDate = null,
        [Description("Reference number")] string? reference = null,
        [Description("Action required to clear this item")] string? actionRequired = null)
    {
        try
        {
            var item = new ReconcilingItem
            {
                ItemType = itemType,
                Description = description,
                Amount = amount,
                ExpectedClearDate = string.IsNullOrEmpty(expectedClearDate) ? null : DateTime.Parse(expectedClearDate),
                Reference = reference,
                ActionRequired = actionRequired
            };

            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/reconciliations/{reconciliationId}/reconciling-items", item);
            var result = await response.Content.ReadFromJsonAsync<ReconciliationResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                total_reconciling_items = result?.Reconciliation?.ReconcilingItems.Count,
                is_reconciled = result?.Reconciliation?.IsReconciled
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Approve a reconciliation.")]
    [ToolName("sor_reconciliation_approve")]
    public async Task<object> ApproveReconciliationAsync(
        [Description("Reconciliation ID")] string reconciliationId,
        [Description("User approving the reconciliation")] string approvedBy)
    {
        try
        {
            var request = new { approvedBy };
            var response = await _httpClient.PatchAsJsonAsync($"{_baseUrl}/api/reconciliations/{reconciliationId}", request);
            var result = await response.Content.ReadFromJsonAsync<ReconciliationResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Reconciliation?.Status,
                approved_at = result?.Reconciliation?.ApprovedAt
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    #endregion

    #region Close Task Tools

    [Description("Query close tasks for a period.")]
    [ToolName("sor_close_task_query")]
    public async Task<object> QueryCloseTasksAsync(
        [Description("Entity code filter")] string? entityCode = null,
        [Description("Fiscal year filter")] int? fiscalYear = null,
        [Description("Fiscal period filter")] int? fiscalPeriod = null,
        [Description("Status filter: NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED")] string? status = null,
        [Description("Category filter: SUBLEDGER_CLOSE, GL_CLOSE, RECONCILIATION, REPORTING, CONSOLIDATION")] string? category = null,
        [Description("Assigned to filter")] string? assignedTo = null)
    {
        try
        {
            var queryParams = new List<string>();
            if (!string.IsNullOrEmpty(entityCode)) queryParams.Add($"entityCode={entityCode}");
            if (fiscalYear.HasValue) queryParams.Add($"fiscalYear={fiscalYear}");
            if (fiscalPeriod.HasValue) queryParams.Add($"fiscalPeriod={fiscalPeriod}");
            if (!string.IsNullOrEmpty(status)) queryParams.Add($"status={status}");
            if (!string.IsNullOrEmpty(category)) queryParams.Add($"category={category}");
            if (!string.IsNullOrEmpty(assignedTo)) queryParams.Add($"assignedTo={assignedTo}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var tasks = await _httpClient.GetFromJsonAsync<List<CloseTask>>($"{_baseUrl}/api/closetasks{queryString}");

            return new
            {
                success = true,
                count = tasks?.Count ?? 0,
                tasks = tasks?.Select(t => new
                {
                    id = t.Id,
                    task_number = t.TaskNumber,
                    task_name = t.TaskName,
                    category = t.TaskCategory,
                    status = t.Status,
                    priority = t.Priority,
                    sequence = t.SequenceOrder,
                    assigned_to = t.AssignedTo,
                    due_date = t.DueDate,
                    blocking_issues = t.BlockingIssues.Where(b => b.Status == "OPEN").Count(),
                    dependencies = t.Dependencies.Count
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Start a close task.")]
    [ToolName("sor_close_task_start")]
    public async Task<object> StartCloseTaskAsync(
        [Description("Close task ID")] string taskId)
    {
        try
        {
            var response = await _httpClient.PostAsync($"{_baseUrl}/api/closetasks/{taskId}/start", null);
            var result = await response.Content.ReadFromJsonAsync<CloseTaskResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Task?.Status,
                started_at = result?.Task?.StartedAt
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Complete a close task.")]
    [ToolName("sor_close_task_complete")]
    public async Task<object> CompleteCloseTaskAsync(
        [Description("Close task ID")] string taskId,
        [Description("User completing the task")] string completedBy,
        [Description("Completion notes")] string? notes = null)
    {
        try
        {
            var request = new { completedBy, notes };
            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/closetasks/{taskId}/complete", request);
            var result = await response.Content.ReadFromJsonAsync<CloseTaskResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Task?.Status,
                completed_at = result?.Task?.CompletedAt,
                actual_duration_hours = result?.Task?.ActualDurationHours
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Report a blocking issue on a close task.")]
    [ToolName("sor_close_task_block")]
    public async Task<object> BlockCloseTaskAsync(
        [Description("Close task ID")] string taskId,
        [Description("Issue type: DATA_MISSING, DEPENDENCY, SYSTEM_ERROR, APPROVAL_PENDING, OTHER")] string issueType,
        [Description("Description of the blocking issue")] string description,
        [Description("User reporting the issue")] string reportedBy)
    {
        try
        {
            var issue = new BlockingIssue
            {
                IssueType = issueType,
                Description = description,
                ReportedBy = reportedBy
            };

            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/closetasks/{taskId}/block", issue);
            var result = await response.Content.ReadFromJsonAsync<CloseTaskResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Task?.Status,
                blocking_issues_count = result?.Task?.BlockingIssues.Count
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Get the overall close status for a period.")]
    [ToolName("sor_close_status_get")]
    public async Task<object> GetCloseStatusAsync(
        [Description("Entity code")] string entityCode,
        [Description("Fiscal year")] int fiscalYear,
        [Description("Fiscal period")] int fiscalPeriod)
    {
        try
        {
            var status = await _httpClient.GetFromJsonAsync<CloseStatus>(
                $"{_baseUrl}/api/closetasks/status/{entityCode}/{fiscalYear}/{fiscalPeriod}");

            return new
            {
                success = true,
                entity_code = status?.EntityCode,
                fiscal_period = $"{status?.FiscalYear}-{status?.FiscalPeriod}",
                status = status?.Status,
                total_tasks = status?.TotalTasks,
                completed_tasks = status?.CompletedTasks,
                in_progress_tasks = status?.InProgressTasks,
                blocked_tasks = status?.BlockedTasks,
                not_started_tasks = status?.NotStartedTasks,
                completion_percentage = status?.CompletionPercentage,
                target_close_date = status?.TargetCloseDate,
                open_blocking_issues = status?.BlockingIssues.Count
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    #endregion

    #region Fiscal Period Tools

    [Description("Get fiscal period status.")]
    [ToolName("sor_fiscal_period_get")]
    public async Task<object> GetFiscalPeriodAsync(
        [Description("Entity code")] string entityCode,
        [Description("Fiscal year")] int fiscalYear,
        [Description("Fiscal period")] int period)
    {
        try
        {
            var fp = await _httpClient.GetFromJsonAsync<FiscalPeriod>(
                $"{_baseUrl}/api/fiscalperiods/{entityCode}/{fiscalYear}/{period}");

            return new
            {
                success = true,
                entity_code = fp?.EntityCode,
                fiscal_year = fp?.FiscalYear,
                period = fp?.Period,
                period_name = fp?.PeriodName,
                status = fp?.Status,
                start_date = fp?.StartDate,
                end_date = fp?.EndDate,
                is_adjustment_period = fp?.IsAdjustmentPeriod,
                subledger_status = fp?.SubledgerStatus,
                soft_close_date = fp?.SoftCloseDate,
                hard_close_date = fp?.HardCloseDate,
                locked_date = fp?.LockedDate
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Close a subledger for a fiscal period.")]
    [ToolName("sor_fiscal_period_close_subledger")]
    public async Task<object> CloseSubledgerAsync(
        [Description("Entity code")] string entityCode,
        [Description("Fiscal year")] int fiscalYear,
        [Description("Fiscal period")] int period,
        [Description("Subledger: AP, AR, FA, INV")] string subledger,
        [Description("User closing the subledger")] string closedBy)
    {
        try
        {
            var request = new { closedBy };
            var response = await _httpClient.PostAsJsonAsync(
                $"{_baseUrl}/api/fiscalperiods/{entityCode}/{fiscalYear}/{period}/subledger/{subledger}/close", request);
            var result = await response.Content.ReadFromJsonAsync<FiscalPeriodResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                subledger_status = result?.Period?.SubledgerStatus
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Perform soft close on a fiscal period.")]
    [ToolName("sor_fiscal_period_soft_close")]
    public async Task<object> SoftClosePeriodAsync(
        [Description("Entity code")] string entityCode,
        [Description("Fiscal year")] int fiscalYear,
        [Description("Fiscal period")] int period,
        [Description("User performing the close")] string closedBy)
    {
        try
        {
            var request = new { closedBy };
            var response = await _httpClient.PostAsJsonAsync(
                $"{_baseUrl}/api/fiscalperiods/{entityCode}/{fiscalYear}/{period}/soft-close", request);
            var result = await response.Content.ReadFromJsonAsync<FiscalPeriodResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Period?.Status,
                soft_close_date = result?.Period?.SoftCloseDate
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Perform hard close on a fiscal period.")]
    [ToolName("sor_fiscal_period_hard_close")]
    public async Task<object> HardClosePeriodAsync(
        [Description("Entity code")] string entityCode,
        [Description("Fiscal year")] int fiscalYear,
        [Description("Fiscal period")] int period,
        [Description("User performing the close")] string closedBy)
    {
        try
        {
            var request = new { closedBy };
            var response = await _httpClient.PostAsJsonAsync(
                $"{_baseUrl}/api/fiscalperiods/{entityCode}/{fiscalYear}/{period}/hard-close", request);
            var result = await response.Content.ReadFromJsonAsync<FiscalPeriodResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Period?.Status,
                hard_close_date = result?.Period?.HardCloseDate
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    #endregion

    #region Approval Tools

    [Description("Create an approval request.")]
    [ToolName("sor_approval_create")]
    public async Task<object> CreateApprovalAsync(
        [Description("Entity code")] string entityCode,
        [Description("Approval type: JOURNAL_ENTRY, RECONCILIATION, CLOSE_TASK, PERIOD_CLOSE, ADJUSTMENT")] string approvalType,
        [Description("Object type: JournalEntry, Reconciliation, CloseTask, FiscalPeriod")] string objectType,
        [Description("Object ID being approved")] string objectId,
        [Description("Description of the object")] string objectDescription,
        [Description("User requesting approval")] string requestedBy,
        [Description("User to approve")] string assignedTo,
        [Description("Due date (YYYY-MM-DD)")] string dueDate,
        [Description("Amount if applicable")] decimal? amount = null,
        [Description("Currency")] string? currency = null,
        [Description("Priority: LOW, NORMAL, HIGH, URGENT")] string priority = "NORMAL",
        [Description("Additional notes")] string? notes = null)
    {
        try
        {
            var request = new CreateApprovalRequest
            {
                EntityCode = entityCode,
                ApprovalType = approvalType,
                ObjectType = objectType,
                ObjectId = objectId,
                ObjectDescription = objectDescription,
                Amount = amount,
                Currency = currency,
                RequestedBy = requestedBy,
                AssignedTo = assignedTo,
                Priority = priority,
                DueDate = DateTime.Parse(dueDate),
                Notes = notes
            };

            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/approvals", request);
            var result = await response.Content.ReadFromJsonAsync<ApprovalResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                approval_id = result?.Approval?.Id,
                approval_number = result?.Approval?.ApprovalNumber,
                status = result?.Approval?.Status
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Query pending approvals.")]
    [ToolName("sor_approval_query")]
    public async Task<object> QueryApprovalsAsync(
        [Description("Entity code filter")] string? entityCode = null,
        [Description("Assigned to filter")] string? assignedTo = null,
        [Description("Status filter: PENDING, APPROVED, REJECTED, CANCELLED, ESCALATED")] string? status = null,
        [Description("Approval type filter")] string? approvalType = null)
    {
        try
        {
            var queryParams = new List<string>();
            if (!string.IsNullOrEmpty(entityCode)) queryParams.Add($"entityCode={entityCode}");
            if (!string.IsNullOrEmpty(assignedTo)) queryParams.Add($"assignedTo={assignedTo}");
            if (!string.IsNullOrEmpty(status)) queryParams.Add($"status={status}");
            if (!string.IsNullOrEmpty(approvalType)) queryParams.Add($"approvalType={approvalType}");

            var queryString = queryParams.Any() ? "?" + string.Join("&", queryParams) : "";
            var approvals = await _httpClient.GetFromJsonAsync<List<Approval>>($"{_baseUrl}/api/approvals{queryString}");

            return new
            {
                success = true,
                count = approvals?.Count ?? 0,
                approvals = approvals?.Select(a => new
                {
                    id = a.Id,
                    approval_number = a.ApprovalNumber,
                    type = a.ApprovalType,
                    object_description = a.ObjectDescription,
                    amount = a.Amount,
                    status = a.Status,
                    priority = a.Priority,
                    requested_by = a.RequestedBy,
                    assigned_to = a.AssignedTo,
                    due_date = a.DueDate
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Approve an approval request.")]
    [ToolName("sor_approval_approve")]
    public async Task<object> ApproveAsync(
        [Description("Approval ID")] string approvalId,
        [Description("User approving")] string approvedBy,
        [Description("Approval comments")] string? comments = null)
    {
        try
        {
            var request = new { approvedBy, comments };
            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/approvals/{approvalId}/approve", request);
            var result = await response.Content.ReadFromJsonAsync<ApprovalResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Approval?.Status,
                decided_at = result?.Approval?.DecidedAt,
                requires_additional_approval = result?.Approval?.RequiresAdditionalApproval,
                next_approver = result?.Approval?.NextApprover
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Reject an approval request.")]
    [ToolName("sor_approval_reject")]
    public async Task<object> RejectAsync(
        [Description("Approval ID")] string approvalId,
        [Description("User rejecting")] string rejectedBy,
        [Description("Rejection reason")] string reason)
    {
        try
        {
            var request = new { rejectedBy, reason };
            var response = await _httpClient.PostAsJsonAsync($"{_baseUrl}/api/approvals/{approvalId}/reject", request);
            var result = await response.Content.ReadFromJsonAsync<ApprovalResponse>();

            return new
            {
                success = result?.Success ?? false,
                message = result?.Message,
                status = result?.Approval?.Status,
                decided_at = result?.Approval?.DecidedAt
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    [Description("Get pending approvals for a specific user.")]
    [ToolName("sor_approval_pending")]
    public async Task<object> GetPendingApprovalsAsync(
        [Description("User to get pending approvals for")] string assignedTo)
    {
        try
        {
            var approvals = await _httpClient.GetFromJsonAsync<List<Approval>>($"{_baseUrl}/api/approvals/pending/{assignedTo}");

            return new
            {
                success = true,
                count = approvals?.Count ?? 0,
                approvals = approvals?.Select(a => new
                {
                    id = a.Id,
                    approval_number = a.ApprovalNumber,
                    type = a.ApprovalType,
                    object_description = a.ObjectDescription,
                    amount = a.Amount,
                    priority = a.Priority,
                    due_date = a.DueDate,
                    requested_by = a.RequestedBy
                }).ToList()
            };
        }
        catch (Exception ex)
        {
            return new { success = false, error = ex.Message };
        }
    }

    #endregion
}
