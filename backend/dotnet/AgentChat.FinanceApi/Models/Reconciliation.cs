using System.Text.Json.Serialization;

namespace AgentChat.FinanceApi.Models;

/// <summary>
/// Represents a reconciliation record in the System of Record
/// </summary>
public class Reconciliation
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("reconciliation_number")]
    public string ReconciliationNumber { get; set; } = string.Empty;

    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }

    [JsonPropertyName("fiscal_period")]
    public int FiscalPeriod { get; set; }

    [JsonPropertyName("reconciliation_type")]
    public string ReconciliationType { get; set; } = string.Empty; // BANK, SUBLEDGER_TO_GL, INTERCOMPANY, INVENTORY, FIXED_ASSET

    [JsonPropertyName("account_number")]
    public string AccountNumber { get; set; } = string.Empty;

    [JsonPropertyName("account_name")]
    public string AccountName { get; set; } = string.Empty;

    [JsonPropertyName("gl_balance")]
    public decimal GlBalance { get; set; }

    [JsonPropertyName("subledger_balance")]
    public decimal SubledgerBalance { get; set; }

    [JsonPropertyName("external_balance")]
    public decimal? ExternalBalance { get; set; }

    [JsonPropertyName("variance")]
    public decimal Variance { get; set; }

    [JsonPropertyName("variance_explanation")]
    public string? VarianceExplanation { get; set; }

    [JsonPropertyName("reconciling_items")]
    public List<ReconcilingItem> ReconcilingItems { get; set; } = new();

    [JsonPropertyName("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, IN_PROGRESS, RECONCILED, EXCEPTION, APPROVED

    [JsonPropertyName("prepared_by")]
    public string PreparedBy { get; set; } = string.Empty;

    [JsonPropertyName("prepared_at")]
    public DateTime PreparedAt { get; set; }

    [JsonPropertyName("reviewed_by")]
    public string? ReviewedBy { get; set; }

    [JsonPropertyName("reviewed_at")]
    public DateTime? ReviewedAt { get; set; }

    [JsonPropertyName("approved_by")]
    public string? ApprovedBy { get; set; }

    [JsonPropertyName("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    [JsonPropertyName("due_date")]
    public DateTime DueDate { get; set; }

    [JsonPropertyName("attachments")]
    public List<string> Attachments { get; set; } = new();

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("procedure_id")]
    public string? ProcedureId { get; set; }

    [JsonPropertyName("is_reconciled")]
    public bool IsReconciled => Math.Abs(Variance) < 0.01m || 
        ReconcilingItems.Sum(r => r.Amount) == Variance;
}

/// <summary>
/// Represents a reconciling item that explains a variance
/// </summary>
public class ReconcilingItem
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("item_type")]
    public string ItemType { get; set; } = string.Empty; // TIMING, ADJUSTMENT, ERROR, OTHER

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }

    [JsonPropertyName("expected_clear_date")]
    public DateTime? ExpectedClearDate { get; set; }

    [JsonPropertyName("reference")]
    public string? Reference { get; set; }

    [JsonPropertyName("action_required")]
    public string? ActionRequired { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, CLEARED, WRITTEN_OFF
}

/// <summary>
/// Request model for creating a reconciliation
/// </summary>
public class CreateReconciliationRequest
{
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }

    [JsonPropertyName("fiscal_period")]
    public int FiscalPeriod { get; set; }

    [JsonPropertyName("reconciliation_type")]
    public string ReconciliationType { get; set; } = string.Empty;

    [JsonPropertyName("account_number")]
    public string AccountNumber { get; set; } = string.Empty;

    [JsonPropertyName("account_name")]
    public string AccountName { get; set; } = string.Empty;

    [JsonPropertyName("gl_balance")]
    public decimal GlBalance { get; set; }

    [JsonPropertyName("subledger_balance")]
    public decimal SubledgerBalance { get; set; }

    [JsonPropertyName("external_balance")]
    public decimal? ExternalBalance { get; set; }

    [JsonPropertyName("prepared_by")]
    public string PreparedBy { get; set; } = string.Empty;

    [JsonPropertyName("due_date")]
    public DateTime DueDate { get; set; }

    [JsonPropertyName("procedure_id")]
    public string? ProcedureId { get; set; }
}

/// <summary>
/// Response model for reconciliation operations
/// </summary>
public class ReconciliationResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("reconciliation")]
    public Reconciliation? Reconciliation { get; set; }

    [JsonPropertyName("validation_errors")]
    public List<string> ValidationErrors { get; set; } = new();
}
