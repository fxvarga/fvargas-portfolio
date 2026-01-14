using AgentChat.FinanceDataLake.Models;

namespace AgentChat.FinanceDataLake.Services;

/// <summary>
/// Interface for the finance data lake service.
/// </summary>
public interface IDataLakeService
{
    Task InitializeAsync();

    // GL Balance queries
    IEnumerable<GlBalance> QueryGlBalances(
        string? entityCode = null,
        int? fiscalYear = null,
        int? fiscalPeriod = null,
        string? accountNumber = null,
        string? accountType = null,
        string? costCenter = null);

    decimal GetAccountBalance(string entityCode, string accountNumber, int fiscalYear, int fiscalPeriod);

    // Fixed Asset queries
    IEnumerable<FixedAsset> QueryFixedAssets(
        string? entityCode = null,
        string? assetClass = null,
        string? status = null);

    FixedAsset? GetFixedAsset(string assetId);

    decimal CalculateMonthlyDepreciation(string entityCode, string? assetClass = null);

    // Lease queries
    IEnumerable<LeaseSchedule> QueryLeases(
        string? entityCode = null,
        string? leaseType = null,
        string? status = null);

    LeaseSchedule? GetLease(string leaseId);

    // Deferred Revenue queries
    IEnumerable<DeferredRevenueSchedule> QueryDeferredRevenue(
        string? entityCode = null,
        string? status = null);

    DeferredRevenueSchedule? GetDeferredRevenueSchedule(string scheduleId);

    // Intercompany queries
    IEnumerable<IntercompanyBalance> QueryIntercompanyBalances(
        string? reportingEntity = null,
        string? counterpartyEntity = null,
        string? fiscalPeriod = null,
        string? reconciliationStatus = null);

    // FX Rate queries
    FxRate? GetFxRate(string fromCurrency, string toCurrency, DateTime date, string rateType = "spot");
    IEnumerable<FxRate> GetFxRates(DateTime date, string rateType = "spot");

    // Aggregation
    object AggregateGlBalances(
        string entityCode,
        int fiscalYear,
        int fiscalPeriod,
        string groupBy = "account_type");

    // Variance Analysis
    IEnumerable<VarianceAnalysisResult> PerformVarianceAnalysis(
        string? entityCode = null,
        string? accountPattern = null,
        int currentYear = 0,
        int currentPeriod = 0,
        string compareTo = "prior_period",
        decimal thresholdPct = 10);
}
