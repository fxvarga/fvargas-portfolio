using System.Text.Json.Serialization;

namespace AgentChat.FinanceApi.Models;

/// <summary>
/// Represents an approval request in the System of Record
/// </summary>
public class Approval
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("approval_number")]
    public string ApprovalNumber { get; set; } = string.Empty;

    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("approval_type")]
    public string ApprovalType { get; set; } = string.Empty; // JOURNAL_ENTRY, RECONCILIATION, CLOSE_TASK, PERIOD_CLOSE, ADJUSTMENT

    [JsonPropertyName("object_type")]
    public string ObjectType { get; set; } = string.Empty; // JournalEntry, Reconciliation, CloseTask, FiscalPeriod

    [JsonPropertyName("object_id")]
    public string ObjectId { get; set; } = string.Empty;

    [JsonPropertyName("object_description")]
    public string ObjectDescription { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal? Amount { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [JsonPropertyName("requested_by")]
    public string RequestedBy { get; set; } = string.Empty;

    [JsonPropertyName("requested_at")]
    public DateTime RequestedAt { get; set; }

    [JsonPropertyName("assigned_to")]
    public string AssignedTo { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED, ESCALATED

    [JsonPropertyName("priority")]
    public string Priority { get; set; } = "NORMAL"; // LOW, NORMAL, HIGH, URGENT

    [JsonPropertyName("due_date")]
    public DateTime DueDate { get; set; }

    [JsonPropertyName("decided_at")]
    public DateTime? DecidedAt { get; set; }

    [JsonPropertyName("decided_by")]
    public string? DecidedBy { get; set; }

    [JsonPropertyName("decision_comments")]
    public string? DecisionComments { get; set; }

    [JsonPropertyName("approval_level")]
    public int ApprovalLevel { get; set; } = 1; // 1, 2, 3 for multi-level approval

    [JsonPropertyName("requires_additional_approval")]
    public bool RequiresAdditionalApproval { get; set; }

    [JsonPropertyName("next_approver")]
    public string? NextApprover { get; set; }

    [JsonPropertyName("escalation_date")]
    public DateTime? EscalationDate { get; set; }

    [JsonPropertyName("escalation_reason")]
    public string? EscalationReason { get; set; }

    [JsonPropertyName("history")]
    public List<ApprovalHistoryEntry> History { get; set; } = new();

    [JsonPropertyName("attachments")]
    public List<string> Attachments { get; set; } = new();

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

/// <summary>
/// Represents a history entry for an approval
/// </summary>
public class ApprovalHistoryEntry
{
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty; // CREATED, APPROVED, REJECTED, ESCALATED, REASSIGNED, CANCELLED

    [JsonPropertyName("performed_by")]
    public string PerformedBy { get; set; } = string.Empty;

    [JsonPropertyName("comments")]
    public string? Comments { get; set; }

    [JsonPropertyName("previous_status")]
    public string? PreviousStatus { get; set; }

    [JsonPropertyName("new_status")]
    public string? NewStatus { get; set; }
}

/// <summary>
/// Request model for creating an approval
/// </summary>
public class CreateApprovalRequest
{
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("approval_type")]
    public string ApprovalType { get; set; } = string.Empty;

    [JsonPropertyName("object_type")]
    public string ObjectType { get; set; } = string.Empty;

    [JsonPropertyName("object_id")]
    public string ObjectId { get; set; } = string.Empty;

    [JsonPropertyName("object_description")]
    public string ObjectDescription { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal? Amount { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [JsonPropertyName("requested_by")]
    public string RequestedBy { get; set; } = string.Empty;

    [JsonPropertyName("assigned_to")]
    public string AssignedTo { get; set; } = string.Empty;

    [JsonPropertyName("priority")]
    public string Priority { get; set; } = "NORMAL";

    [JsonPropertyName("due_date")]
    public DateTime DueDate { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

/// <summary>
/// Request model for processing an approval
/// </summary>
public class ProcessApprovalRequest
{
    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty; // APPROVE, REJECT, ESCALATE, REASSIGN

    [JsonPropertyName("decided_by")]
    public string DecidedBy { get; set; } = string.Empty;

    [JsonPropertyName("comments")]
    public string? Comments { get; set; }

    [JsonPropertyName("reassign_to")]
    public string? ReassignTo { get; set; }
}

/// <summary>
/// Response model for approval operations
/// </summary>
public class ApprovalResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("approval")]
    public Approval? Approval { get; set; }

    [JsonPropertyName("validation_errors")]
    public List<string> ValidationErrors { get; set; } = new();
}
