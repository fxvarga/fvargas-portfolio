using System.Text.Json.Serialization;

namespace AgentChat.FinanceApi.Models;

/// <summary>
/// Represents a journal entry in the System of Record
/// </summary>
public class JournalEntry
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("entry_number")]
    public string EntryNumber { get; set; } = string.Empty;

    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }

    [JsonPropertyName("fiscal_period")]
    public int FiscalPeriod { get; set; }

    [JsonPropertyName("entry_date")]
    public DateTime EntryDate { get; set; }

    [JsonPropertyName("effective_date")]
    public DateTime EffectiveDate { get; set; }

    [JsonPropertyName("entry_type")]
    public string EntryType { get; set; } = string.Empty; // STANDARD, REVERSING, RECURRING, ADJUSTMENT, RECLASSIFICATION

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("lines")]
    public List<JournalEntryLine> Lines { get; set; } = new();

    [JsonPropertyName("status")]
    public string Status { get; set; } = "DRAFT"; // DRAFT, PENDING_APPROVAL, APPROVED, POSTED, REVERSED

    [JsonPropertyName("created_by")]
    public string CreatedBy { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }

    [JsonPropertyName("approved_by")]
    public string? ApprovedBy { get; set; }

    [JsonPropertyName("approved_at")]
    public DateTime? ApprovedAt { get; set; }

    [JsonPropertyName("posted_by")]
    public string? PostedBy { get; set; }

    [JsonPropertyName("posted_at")]
    public DateTime? PostedAt { get; set; }

    [JsonPropertyName("source_system")]
    public string SourceSystem { get; set; } = "MANUAL";

    [JsonPropertyName("reference")]
    public string? Reference { get; set; }

    [JsonPropertyName("attachments")]
    public List<string> Attachments { get; set; } = new();

    [JsonPropertyName("is_reversing")]
    public bool IsReversing { get; set; }

    [JsonPropertyName("reversal_date")]
    public DateTime? ReversalDate { get; set; }

    [JsonPropertyName("reversed_entry_id")]
    public string? ReversedEntryId { get; set; }

    [JsonPropertyName("procedure_id")]
    public string? ProcedureId { get; set; }

    [JsonPropertyName("total_debits")]
    public decimal TotalDebits => Lines.Sum(l => l.DebitAmount);

    [JsonPropertyName("total_credits")]
    public decimal TotalCredits => Lines.Sum(l => l.CreditAmount);

    [JsonPropertyName("is_balanced")]
    public bool IsBalanced => Math.Abs(TotalDebits - TotalCredits) < 0.01m;
}

/// <summary>
/// Represents a single line item in a journal entry
/// </summary>
public class JournalEntryLine
{
    [JsonPropertyName("line_number")]
    public int LineNumber { get; set; }

    [JsonPropertyName("account_number")]
    public string AccountNumber { get; set; } = string.Empty;

    [JsonPropertyName("account_name")]
    public string AccountName { get; set; } = string.Empty;

    [JsonPropertyName("debit_amount")]
    public decimal DebitAmount { get; set; }

    [JsonPropertyName("credit_amount")]
    public decimal CreditAmount { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("cost_center")]
    public string? CostCenter { get; set; }

    [JsonPropertyName("department")]
    public string? Department { get; set; }

    [JsonPropertyName("project")]
    public string? Project { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("tax_code")]
    public string? TaxCode { get; set; }

    [JsonPropertyName("intercompany_entity")]
    public string? IntercompanyEntity { get; set; }
}

/// <summary>
/// Request model for creating a journal entry
/// </summary>
public class CreateJournalEntryRequest
{
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }

    [JsonPropertyName("fiscal_period")]
    public int FiscalPeriod { get; set; }

    [JsonPropertyName("effective_date")]
    public DateTime EffectiveDate { get; set; }

    [JsonPropertyName("entry_type")]
    public string EntryType { get; set; } = "STANDARD";

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("lines")]
    public List<JournalEntryLine> Lines { get; set; } = new();

    [JsonPropertyName("created_by")]
    public string CreatedBy { get; set; } = string.Empty;

    [JsonPropertyName("source_system")]
    public string SourceSystem { get; set; } = "MANUAL";

    [JsonPropertyName("reference")]
    public string? Reference { get; set; }

    [JsonPropertyName("is_reversing")]
    public bool IsReversing { get; set; }

    [JsonPropertyName("reversal_date")]
    public DateTime? ReversalDate { get; set; }

    [JsonPropertyName("procedure_id")]
    public string? ProcedureId { get; set; }
}

/// <summary>
/// Response model for journal entry operations
/// </summary>
public class JournalEntryResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("entry")]
    public JournalEntry? Entry { get; set; }

    [JsonPropertyName("validation_errors")]
    public List<string> ValidationErrors { get; set; } = new();
}
