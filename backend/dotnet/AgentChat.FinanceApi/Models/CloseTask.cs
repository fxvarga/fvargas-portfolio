using System.Text.Json.Serialization;

namespace AgentChat.FinanceApi.Models;

/// <summary>
/// Represents a close task in the month-end close process
/// </summary>
public class CloseTask
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("task_number")]
    public string TaskNumber { get; set; } = string.Empty;

    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }

    [JsonPropertyName("fiscal_period")]
    public int FiscalPeriod { get; set; }

    [JsonPropertyName("task_name")]
    public string TaskName { get; set; } = string.Empty;

    [JsonPropertyName("task_category")]
    public string TaskCategory { get; set; } = string.Empty; // SUBLEDGER_CLOSE, GL_CLOSE, RECONCILIATION, REPORTING, CONSOLIDATION

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("procedure_id")]
    public string? ProcedureId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED

    [JsonPropertyName("priority")]
    public int Priority { get; set; } = 3; // 1-5, 1 being highest

    [JsonPropertyName("sequence_order")]
    public int SequenceOrder { get; set; }

    [JsonPropertyName("assigned_to")]
    public string AssignedTo { get; set; } = string.Empty;

    [JsonPropertyName("assigned_team")]
    public string? AssignedTeam { get; set; }

    [JsonPropertyName("due_date")]
    public DateTime DueDate { get; set; }

    [JsonPropertyName("started_at")]
    public DateTime? StartedAt { get; set; }

    [JsonPropertyName("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("completed_by")]
    public string? CompletedBy { get; set; }

    [JsonPropertyName("dependencies")]
    public List<string> Dependencies { get; set; } = new(); // List of task IDs this depends on

    [JsonPropertyName("dependents")]
    public List<string> Dependents { get; set; } = new(); // List of task IDs that depend on this

    [JsonPropertyName("blocking_issues")]
    public List<BlockingIssue> BlockingIssues { get; set; } = new();

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("journal_entries_created")]
    public List<string> JournalEntriesCreated { get; set; } = new();

    [JsonPropertyName("reconciliations_created")]
    public List<string> ReconciliationsCreated { get; set; } = new();

    [JsonPropertyName("estimated_duration_hours")]
    public decimal EstimatedDurationHours { get; set; }

    [JsonPropertyName("actual_duration_hours")]
    public decimal? ActualDurationHours { get; set; }

    [JsonPropertyName("is_automated")]
    public bool IsAutomated { get; set; }

    [JsonPropertyName("automation_status")]
    public string? AutomationStatus { get; set; }
}

/// <summary>
/// Represents a blocking issue preventing task completion
/// </summary>
public class BlockingIssue
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("issue_type")]
    public string IssueType { get; set; } = string.Empty; // DATA_MISSING, DEPENDENCY, SYSTEM_ERROR, APPROVAL_PENDING, OTHER

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("reported_at")]
    public DateTime ReportedAt { get; set; }

    [JsonPropertyName("reported_by")]
    public string ReportedBy { get; set; } = string.Empty;

    [JsonPropertyName("resolved_at")]
    public DateTime? ResolvedAt { get; set; }

    [JsonPropertyName("resolved_by")]
    public string? ResolvedBy { get; set; }

    [JsonPropertyName("resolution")]
    public string? Resolution { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED
}

/// <summary>
/// Request model for updating a close task
/// </summary>
public class UpdateCloseTaskRequest
{
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("assigned_to")]
    public string? AssignedTo { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("completed_by")]
    public string? CompletedBy { get; set; }

    [JsonPropertyName("blocking_issue")]
    public BlockingIssue? BlockingIssue { get; set; }

    [JsonPropertyName("journal_entry_id")]
    public string? JournalEntryId { get; set; }

    [JsonPropertyName("reconciliation_id")]
    public string? ReconciliationId { get; set; }
}

/// <summary>
/// Response model for close task operations
/// </summary>
public class CloseTaskResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("task")]
    public CloseTask? Task { get; set; }

    [JsonPropertyName("validation_errors")]
    public List<string> ValidationErrors { get; set; } = new();
}

/// <summary>
/// Represents the overall close status for a period
/// </summary>
public class CloseStatus
{
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }

    [JsonPropertyName("fiscal_period")]
    public int FiscalPeriod { get; set; }

    [JsonPropertyName("total_tasks")]
    public int TotalTasks { get; set; }

    [JsonPropertyName("completed_tasks")]
    public int CompletedTasks { get; set; }

    [JsonPropertyName("in_progress_tasks")]
    public int InProgressTasks { get; set; }

    [JsonPropertyName("blocked_tasks")]
    public int BlockedTasks { get; set; }

    [JsonPropertyName("not_started_tasks")]
    public int NotStartedTasks { get; set; }

    [JsonPropertyName("completion_percentage")]
    public decimal CompletionPercentage => TotalTasks > 0 ? (decimal)CompletedTasks / TotalTasks * 100 : 0;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, IN_PROGRESS, SOFT_CLOSE, HARD_CLOSE

    [JsonPropertyName("target_close_date")]
    public DateTime TargetCloseDate { get; set; }

    [JsonPropertyName("actual_close_date")]
    public DateTime? ActualCloseDate { get; set; }

    [JsonPropertyName("blocking_issues")]
    public List<BlockingIssue> BlockingIssues { get; set; } = new();
}
