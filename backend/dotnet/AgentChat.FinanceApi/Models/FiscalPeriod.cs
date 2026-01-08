using System.Text.Json.Serialization;

namespace AgentChat.FinanceApi.Models;

/// <summary>
/// Represents a fiscal period in the System of Record
/// </summary>
public class FiscalPeriod
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = string.Empty;

    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }

    [JsonPropertyName("fiscal_period")]
    public int Period { get; set; }

    [JsonPropertyName("period_name")]
    public string PeriodName { get; set; } = string.Empty;

    [JsonPropertyName("start_date")]
    public DateTime StartDate { get; set; }

    [JsonPropertyName("end_date")]
    public DateTime EndDate { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, SOFT_CLOSE, HARD_CLOSE, LOCKED

    [JsonPropertyName("is_adjustment_period")]
    public bool IsAdjustmentPeriod { get; set; }

    [JsonPropertyName("subledger_status")]
    public Dictionary<string, string> SubledgerStatus { get; set; } = new(); // AP, AR, FA, INV -> OPEN/CLOSED

    [JsonPropertyName("soft_close_date")]
    public DateTime? SoftCloseDate { get; set; }

    [JsonPropertyName("hard_close_date")]
    public DateTime? HardCloseDate { get; set; }

    [JsonPropertyName("locked_date")]
    public DateTime? LockedDate { get; set; }

    [JsonPropertyName("locked_by")]
    public string? LockedBy { get; set; }

    [JsonPropertyName("reopen_reason")]
    public string? ReopenReason { get; set; }

    [JsonPropertyName("last_reopened_at")]
    public DateTime? LastReopenedAt { get; set; }

    [JsonPropertyName("last_reopened_by")]
    public string? LastReopenedBy { get; set; }
}

/// <summary>
/// Request model for updating fiscal period status
/// </summary>
public class UpdateFiscalPeriodRequest
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("updated_by")]
    public string UpdatedBy { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    public string? Reason { get; set; }

    [JsonPropertyName("subledger")]
    public string? Subledger { get; set; }

    [JsonPropertyName("subledger_status")]
    public string? SubledgerStatus { get; set; }
}

/// <summary>
/// Response model for fiscal period operations
/// </summary>
public class FiscalPeriodResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("period")]
    public FiscalPeriod? Period { get; set; }

    [JsonPropertyName("validation_errors")]
    public List<string> ValidationErrors { get; set; } = new();
}
