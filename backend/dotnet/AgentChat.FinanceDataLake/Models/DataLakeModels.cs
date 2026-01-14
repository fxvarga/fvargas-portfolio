using System.Text.Json.Serialization;

namespace AgentChat.FinanceDataLake.Models;

/// <summary>
/// General Ledger balance record from the data lake
/// </summary>
public class GlBalance
{
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = "";
    
    [JsonPropertyName("fiscal_year")]
    public int FiscalYear { get; set; }
    
    [JsonPropertyName("fiscal_period")]
    public int FiscalPeriod { get; set; }
    
    [JsonPropertyName("account_number")]
    public string AccountNumber { get; set; } = "";
    
    [JsonPropertyName("account_name")]
    public string AccountName { get; set; } = "";
    
    [JsonPropertyName("account_type")]
    public string AccountType { get; set; } = ""; // Asset, Liability, Equity, Revenue, Expense
    
    [JsonPropertyName("cost_center")]
    public string? CostCenter { get; set; }
    
    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";
    
    [JsonPropertyName("opening_balance")]
    public decimal OpeningBalance { get; set; }
    
    [JsonPropertyName("period_debits")]
    public decimal PeriodDebits { get; set; }
    
    [JsonPropertyName("period_credits")]
    public decimal PeriodCredits { get; set; }
    
    [JsonPropertyName("closing_balance")]
    public decimal ClosingBalance { get; set; }
    
    [JsonPropertyName("ytd_debits")]
    public decimal YtdDebits { get; set; }
    
    [JsonPropertyName("ytd_credits")]
    public decimal YtdCredits { get; set; }
    
    [JsonPropertyName("last_updated")]
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// Fixed Asset record from the data lake
/// </summary>
public class FixedAsset
{
    [JsonPropertyName("asset_id")]
    public string AssetId { get; set; } = "";
    
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = "";
    
    [JsonPropertyName("asset_number")]
    public string AssetNumber { get; set; } = "";
    
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    
    [JsonPropertyName("asset_class")]
    public string AssetClass { get; set; } = "";
    
    [JsonPropertyName("acquisition_date")]
    public DateTime AcquisitionDate { get; set; }
    
    [JsonPropertyName("in_service_date")]
    public DateTime InServiceDate { get; set; }
    
    [JsonPropertyName("original_cost")]
    public decimal OriginalCost { get; set; }
    
    [JsonPropertyName("accumulated_depreciation")]
    public decimal AccumulatedDepreciation { get; set; }
    
    [JsonPropertyName("net_book_value")]
    public decimal NetBookValue { get; set; }
    
    [JsonPropertyName("useful_life_years")]
    public int UsefulLifeYears { get; set; }
    
    [JsonPropertyName("residual_value")]
    public decimal ResidualValue { get; set; }
    
    [JsonPropertyName("depreciation_method")]
    public string DepreciationMethod { get; set; } = "straight_line";
    
    [JsonPropertyName("monthly_depreciation")]
    public decimal MonthlyDepreciation { get; set; }
    
    [JsonPropertyName("asset_account")]
    public string AssetAccount { get; set; } = "";
    
    [JsonPropertyName("depreciation_account")]
    public string DepreciationAccount { get; set; } = "";
    
    [JsonPropertyName("expense_account")]
    public string ExpenseAccount { get; set; } = "";
    
    [JsonPropertyName("location")]
    public string? Location { get; set; }
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active"; // active, disposed, fully_depreciated
    
    [JsonPropertyName("last_depreciation_date")]
    public DateTime? LastDepreciationDate { get; set; }
}

/// <summary>
/// Lease schedule record for ASC 842 compliance
/// </summary>
public class LeaseSchedule
{
    [JsonPropertyName("lease_id")]
    public string LeaseId { get; set; } = "";
    
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = "";
    
    [JsonPropertyName("lease_number")]
    public string LeaseNumber { get; set; } = "";
    
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    
    [JsonPropertyName("lease_type")]
    public string LeaseType { get; set; } = ""; // operating, finance
    
    [JsonPropertyName("commencement_date")]
    public DateTime CommencementDate { get; set; }
    
    [JsonPropertyName("termination_date")]
    public DateTime TerminationDate { get; set; }
    
    [JsonPropertyName("base_rent_monthly")]
    public decimal BaseRentMonthly { get; set; }
    
    [JsonPropertyName("discount_rate")]
    public decimal DiscountRate { get; set; }
    
    [JsonPropertyName("rou_asset_original")]
    public decimal RouAssetOriginal { get; set; }
    
    [JsonPropertyName("rou_asset_current")]
    public decimal RouAssetCurrent { get; set; }
    
    [JsonPropertyName("lease_liability_original")]
    public decimal LeaseLiabilityOriginal { get; set; }
    
    [JsonPropertyName("lease_liability_current")]
    public decimal LeaseLiabilityCurrent { get; set; }
    
    [JsonPropertyName("lease_liability_short_term")]
    public decimal LeaseLiabilityShortTerm { get; set; }
    
    [JsonPropertyName("lease_liability_long_term")]
    public decimal LeaseLiabilityLongTerm { get; set; }
    
    [JsonPropertyName("monthly_lease_expense")]
    public decimal MonthlyLeaseExpense { get; set; }
    
    [JsonPropertyName("monthly_interest")]
    public decimal MonthlyInterest { get; set; }
    
    [JsonPropertyName("monthly_amortization")]
    public decimal MonthlyAmortization { get; set; }
    
    [JsonPropertyName("vendor_name")]
    public string VendorName { get; set; } = "";
    
    [JsonPropertyName("asset_type")]
    public string AssetType { get; set; } = ""; // real_estate, equipment, vehicle
    
    [JsonPropertyName("location")]
    public string? Location { get; set; }
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";
}

/// <summary>
/// Deferred revenue schedule for ASC 606 compliance
/// </summary>
public class DeferredRevenueSchedule
{
    [JsonPropertyName("schedule_id")]
    public string ScheduleId { get; set; } = "";
    
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = "";
    
    [JsonPropertyName("contract_id")]
    public string ContractId { get; set; } = "";
    
    [JsonPropertyName("contract_number")]
    public string ContractNumber { get; set; } = "";
    
    [JsonPropertyName("customer_name")]
    public string CustomerName { get; set; } = "";
    
    [JsonPropertyName("contract_start_date")]
    public DateTime ContractStartDate { get; set; }
    
    [JsonPropertyName("contract_end_date")]
    public DateTime ContractEndDate { get; set; }
    
    [JsonPropertyName("total_contract_value")]
    public decimal TotalContractValue { get; set; }
    
    [JsonPropertyName("recognition_method")]
    public string RecognitionMethod { get; set; } = "straight_line"; // straight_line, output, input, milestone
    
    [JsonPropertyName("total_recognized")]
    public decimal TotalRecognized { get; set; }
    
    [JsonPropertyName("deferred_balance")]
    public decimal DeferredBalance { get; set; }
    
    [JsonPropertyName("monthly_recognition")]
    public decimal MonthlyRecognition { get; set; }
    
    [JsonPropertyName("deferred_account")]
    public string DeferredAccount { get; set; } = "";
    
    [JsonPropertyName("revenue_account")]
    public string RevenueAccount { get; set; } = "";
    
    [JsonPropertyName("performance_obligation")]
    public string PerformanceObligation { get; set; } = "";
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";
    
    [JsonPropertyName("last_recognition_date")]
    public DateTime? LastRecognitionDate { get; set; }
}

/// <summary>
/// Intercompany balance for elimination
/// </summary>
public class IntercompanyBalance
{
    [JsonPropertyName("balance_id")]
    public string BalanceId { get; set; } = "";
    
    [JsonPropertyName("reporting_entity")]
    public string ReportingEntity { get; set; } = "";
    
    [JsonPropertyName("counterparty_entity")]
    public string CounterpartyEntity { get; set; } = "";
    
    [JsonPropertyName("fiscal_period")]
    public string FiscalPeriod { get; set; } = ""; // YYYY-MM
    
    [JsonPropertyName("transaction_type")]
    public string TransactionType { get; set; } = ""; // receivable, payable, loan, revenue, expense
    
    [JsonPropertyName("account_number")]
    public string AccountNumber { get; set; } = "";
    
    [JsonPropertyName("local_currency")]
    public string LocalCurrency { get; set; } = "";
    
    [JsonPropertyName("local_amount")]
    public decimal LocalAmount { get; set; }
    
    [JsonPropertyName("reporting_currency")]
    public string ReportingCurrency { get; set; } = "USD";
    
    [JsonPropertyName("reporting_amount")]
    public decimal ReportingAmount { get; set; }
    
    [JsonPropertyName("counterparty_amount")]
    public decimal? CounterpartyAmount { get; set; }
    
    [JsonPropertyName("difference")]
    public decimal? Difference { get; set; }
    
    [JsonPropertyName("reconciliation_status")]
    public string ReconciliationStatus { get; set; } = "pending"; // pending, matched, unmatched
    
    [JsonPropertyName("last_updated")]
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// FX rate for currency translation
/// </summary>
public class FxRate
{
    [JsonPropertyName("rate_date")]
    public DateTime RateDate { get; set; }
    
    [JsonPropertyName("from_currency")]
    public string FromCurrency { get; set; } = "";
    
    [JsonPropertyName("to_currency")]
    public string ToCurrency { get; set; } = "USD";
    
    [JsonPropertyName("rate_type")]
    public string RateType { get; set; } = ""; // spot, average, historical
    
    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }
    
    [JsonPropertyName("source")]
    public string Source { get; set; } = "treasury";
}

/// <summary>
/// Prepaid expense amortization schedule
/// </summary>
public class PrepaidSchedule
{
    [JsonPropertyName("schedule_id")]
    public string ScheduleId { get; set; } = "";
    
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = "";
    
    [JsonPropertyName("prepaid_id")]
    public string PrepaidId { get; set; } = "";
    
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";
    
    [JsonPropertyName("vendor_name")]
    public string VendorName { get; set; } = "";
    
    [JsonPropertyName("invoice_date")]
    public DateTime InvoiceDate { get; set; }
    
    [JsonPropertyName("start_date")]
    public DateTime StartDate { get; set; }
    
    [JsonPropertyName("end_date")]
    public DateTime EndDate { get; set; }
    
    [JsonPropertyName("original_amount")]
    public decimal OriginalAmount { get; set; }
    
    [JsonPropertyName("amortized_amount")]
    public decimal AmortizedAmount { get; set; }
    
    [JsonPropertyName("remaining_amount")]
    public decimal RemainingAmount { get; set; }
    
    [JsonPropertyName("monthly_amortization")]
    public decimal MonthlyAmortization { get; set; }
    
    [JsonPropertyName("prepaid_account")]
    public string PrepaidAccount { get; set; } = "";
    
    [JsonPropertyName("expense_account")]
    public string ExpenseAccount { get; set; } = "";
    
    [JsonPropertyName("expense_type")]
    public string ExpenseType { get; set; } = ""; // insurance, rent, software, maintenance
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";
    
    [JsonPropertyName("last_amortization_date")]
    public DateTime? LastAmortizationDate { get; set; }
}

/// <summary>
/// Variance analysis result for comparing periods or budget
/// </summary>
public class VarianceAnalysisResult
{
    [JsonPropertyName("account_number")]
    public string AccountNumber { get; set; } = "";
    
    [JsonPropertyName("account_name")]
    public string AccountName { get; set; } = "";
    
    [JsonPropertyName("account_type")]
    public string AccountType { get; set; } = "";
    
    [JsonPropertyName("entity_code")]
    public string EntityCode { get; set; } = "";
    
    [JsonPropertyName("current_period")]
    public string CurrentPeriod { get; set; } = "";
    
    [JsonPropertyName("comparison_period")]
    public string ComparisonPeriod { get; set; } = "";
    
    [JsonPropertyName("compare_to")]
    public string CompareTo { get; set; } = "";
    
    [JsonPropertyName("current_balance")]
    public decimal CurrentBalance { get; set; }
    
    [JsonPropertyName("comparison_balance")]
    public decimal ComparisonBalance { get; set; }
    
    [JsonPropertyName("variance_amount")]
    public decimal VarianceAmount { get; set; }
    
    [JsonPropertyName("variance_percent")]
    public decimal VariancePercent { get; set; }
    
    [JsonPropertyName("is_favorable")]
    public bool IsFavorable { get; set; }
    
    [JsonPropertyName("exceeds_threshold")]
    public bool ExceedsThreshold { get; set; }
}
