using System.Reflection;
using System.Text.Json;
using AgentChat.FinanceDataLake.Models;

namespace AgentChat.FinanceDataLake.Services;

/// <summary>
/// Service for querying the mock finance data lake (simulated SAP data).
/// </summary>
public class DataLakeService : IDataLakeService
{
    private readonly Assembly _assembly;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _isInitialized;

    private List<GlBalance> _glBalances = [];
    private List<FixedAsset> _fixedAssets = [];
    private List<LeaseSchedule> _leaseSchedules = [];
    private List<DeferredRevenueSchedule> _deferredRevenue = [];
    private List<IntercompanyBalance> _intercompanyBalances = [];
    private List<FxRate> _fxRates = [];
    private List<PrepaidSchedule> _prepaidSchedules = [];

    public DataLakeService()
    {
        _assembly = Assembly.GetExecutingAssembly();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        _isInitialized = false;
    }

    public async Task InitializeAsync()
    {
        if (_isInitialized) return;

        await Task.Run(() =>
        {
            LoadGlBalances();
            LoadFixedAssets();
            LoadLeaseSchedules();
            LoadDeferredRevenue();
            LoadIntercompanyBalances();
            LoadFxRates();
        });

        _isInitialized = true;
    }

    private void LoadGlBalances()
    {
        var resources = _assembly.GetManifestResourceNames()
            .Where(n => n.Contains(".Data.gl_balances.") && n.EndsWith(".json"));

        foreach (var resourceName in resources)
        {
            LoadJsonResource(resourceName, ref _glBalances);
        }
    }

    private void LoadFixedAssets()
    {
        var resources = _assembly.GetManifestResourceNames()
            .Where(n => n.Contains(".Data.fixed_assets.") && n.EndsWith(".json"));

        foreach (var resourceName in resources)
        {
            LoadJsonResource(resourceName, ref _fixedAssets);
        }
    }

    private void LoadLeaseSchedules()
    {
        var resources = _assembly.GetManifestResourceNames()
            .Where(n => n.Contains(".Data.lease_schedules.") && n.EndsWith(".json"));

        foreach (var resourceName in resources)
        {
            LoadJsonResource(resourceName, ref _leaseSchedules);
        }
    }

    private void LoadDeferredRevenue()
    {
        var resources = _assembly.GetManifestResourceNames()
            .Where(n => n.Contains(".Data.deferred_revenue.") && n.EndsWith(".json"));

        foreach (var resourceName in resources)
        {
            LoadJsonResource(resourceName, ref _deferredRevenue);
        }
    }

    private void LoadIntercompanyBalances()
    {
        var resources = _assembly.GetManifestResourceNames()
            .Where(n => n.Contains(".Data.intercompany.") && n.EndsWith(".json"));

        foreach (var resourceName in resources)
        {
            LoadJsonResource(resourceName, ref _intercompanyBalances);
        }
    }

    private void LoadFxRates()
    {
        var resources = _assembly.GetManifestResourceNames()
            .Where(n => n.Contains(".Data.fx_rates.") && n.EndsWith(".json"));

        foreach (var resourceName in resources)
        {
            LoadJsonResource(resourceName, ref _fxRates);
        }
    }

    private void LoadJsonResource<T>(string resourceName, ref List<T> targetList)
    {
        try
        {
            using var stream = _assembly.GetManifestResourceStream(resourceName);
            if (stream == null) return;

            using var reader = new StreamReader(stream);
            var json = reader.ReadToEnd();
            var items = JsonSerializer.Deserialize<List<T>>(json, _jsonOptions);
            
            if (items != null)
            {
                targetList.AddRange(items);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading {resourceName}: {ex.Message}");
        }
    }

    #region GL Balance Queries

    public IEnumerable<GlBalance> QueryGlBalances(
        string? entityCode = null,
        int? fiscalYear = null,
        int? fiscalPeriod = null,
        string? accountNumber = null,
        string? accountType = null,
        string? costCenter = null)
    {
        EnsureInitialized();

        var query = _glBalances.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(g => g.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));

        if (fiscalYear.HasValue)
            query = query.Where(g => g.FiscalYear == fiscalYear.Value);

        if (fiscalPeriod.HasValue)
            query = query.Where(g => g.FiscalPeriod == fiscalPeriod.Value);

        if (!string.IsNullOrEmpty(accountNumber))
            query = query.Where(g => g.AccountNumber.StartsWith(accountNumber));

        if (!string.IsNullOrEmpty(accountType))
            query = query.Where(g => g.AccountType.Equals(accountType, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(costCenter))
            query = query.Where(g => g.CostCenter?.Equals(costCenter, StringComparison.OrdinalIgnoreCase) == true);

        return query.ToList();
    }

    public decimal GetAccountBalance(string entityCode, string accountNumber, int fiscalYear, int fiscalPeriod)
    {
        EnsureInitialized();

        var balance = _glBalances.FirstOrDefault(g =>
            g.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase) &&
            g.AccountNumber == accountNumber &&
            g.FiscalYear == fiscalYear &&
            g.FiscalPeriod == fiscalPeriod);

        return balance?.ClosingBalance ?? 0;
    }

    #endregion

    #region Fixed Asset Queries

    public IEnumerable<FixedAsset> QueryFixedAssets(
        string? entityCode = null,
        string? assetClass = null,
        string? status = null)
    {
        EnsureInitialized();

        var query = _fixedAssets.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(a => a.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(assetClass))
            query = query.Where(a => a.AssetClass.Equals(assetClass, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

        return query.ToList();
    }

    public FixedAsset? GetFixedAsset(string assetId)
    {
        EnsureInitialized();
        return _fixedAssets.FirstOrDefault(a => a.AssetId.Equals(assetId, StringComparison.OrdinalIgnoreCase));
    }

    public decimal CalculateMonthlyDepreciation(string entityCode, string? assetClass = null)
    {
        EnsureInitialized();

        var assets = _fixedAssets.Where(a =>
            a.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase) &&
            a.Status == "active");

        if (!string.IsNullOrEmpty(assetClass))
            assets = assets.Where(a => a.AssetClass.Equals(assetClass, StringComparison.OrdinalIgnoreCase));

        return assets.Sum(a => a.MonthlyDepreciation);
    }

    #endregion

    #region Lease Queries

    public IEnumerable<LeaseSchedule> QueryLeases(
        string? entityCode = null,
        string? leaseType = null,
        string? status = null)
    {
        EnsureInitialized();

        var query = _leaseSchedules.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(l => l.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(leaseType))
            query = query.Where(l => l.LeaseType.Equals(leaseType, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(status))
            query = query.Where(l => l.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

        return query.ToList();
    }

    public LeaseSchedule? GetLease(string leaseId)
    {
        EnsureInitialized();
        return _leaseSchedules.FirstOrDefault(l => l.LeaseId.Equals(leaseId, StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region Deferred Revenue Queries

    public IEnumerable<DeferredRevenueSchedule> QueryDeferredRevenue(
        string? entityCode = null,
        string? status = null)
    {
        EnsureInitialized();

        var query = _deferredRevenue.AsEnumerable();

        if (!string.IsNullOrEmpty(entityCode))
            query = query.Where(d => d.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(status))
            query = query.Where(d => d.Status.Equals(status, StringComparison.OrdinalIgnoreCase));

        return query.ToList();
    }

    public DeferredRevenueSchedule? GetDeferredRevenueSchedule(string scheduleId)
    {
        EnsureInitialized();
        return _deferredRevenue.FirstOrDefault(d => d.ScheduleId.Equals(scheduleId, StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region Intercompany Queries

    public IEnumerable<IntercompanyBalance> QueryIntercompanyBalances(
        string? reportingEntity = null,
        string? counterpartyEntity = null,
        string? fiscalPeriod = null,
        string? reconciliationStatus = null)
    {
        EnsureInitialized();

        var query = _intercompanyBalances.AsEnumerable();

        if (!string.IsNullOrEmpty(reportingEntity))
            query = query.Where(i => i.ReportingEntity.Equals(reportingEntity, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(counterpartyEntity))
            query = query.Where(i => i.CounterpartyEntity.Equals(counterpartyEntity, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(fiscalPeriod))
            query = query.Where(i => i.FiscalPeriod == fiscalPeriod);

        if (!string.IsNullOrEmpty(reconciliationStatus))
            query = query.Where(i => i.ReconciliationStatus.Equals(reconciliationStatus, StringComparison.OrdinalIgnoreCase));

        return query.ToList();
    }

    #endregion

    #region FX Rate Queries

    public FxRate? GetFxRate(string fromCurrency, string toCurrency, DateTime date, string rateType = "spot")
    {
        EnsureInitialized();

        // Find the closest rate on or before the requested date
        return _fxRates
            .Where(r =>
                r.FromCurrency.Equals(fromCurrency, StringComparison.OrdinalIgnoreCase) &&
                r.ToCurrency.Equals(toCurrency, StringComparison.OrdinalIgnoreCase) &&
                r.RateType.Equals(rateType, StringComparison.OrdinalIgnoreCase) &&
                r.RateDate <= date)
            .OrderByDescending(r => r.RateDate)
            .FirstOrDefault();
    }

    public IEnumerable<FxRate> GetFxRates(DateTime date, string rateType = "spot")
    {
        EnsureInitialized();

        return _fxRates
            .Where(r => r.RateDate.Date == date.Date && 
                        r.RateType.Equals(rateType, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    #endregion

    #region Aggregation Queries

    public object AggregateGlBalances(
        string entityCode,
        int fiscalYear,
        int fiscalPeriod,
        string groupBy = "account_type")
    {
        EnsureInitialized();

        var balances = _glBalances.Where(g =>
            g.EntityCode.Equals(entityCode, StringComparison.OrdinalIgnoreCase) &&
            g.FiscalYear == fiscalYear &&
            g.FiscalPeriod == fiscalPeriod);

        return groupBy.ToLower() switch
        {
            "account_type" => balances
                .GroupBy(g => g.AccountType)
                .Select(g => new
                {
                    group = g.Key,
                    total_balance = g.Sum(x => x.ClosingBalance),
                    account_count = g.Count()
                })
                .ToList(),

            "cost_center" => balances
                .Where(g => !string.IsNullOrEmpty(g.CostCenter))
                .GroupBy(g => g.CostCenter!)
                .Select(g => new
                {
                    group = g.Key,
                    total_balance = g.Sum(x => x.ClosingBalance),
                    account_count = g.Count()
                })
                .ToList(),

            _ => throw new ArgumentException($"Unknown groupBy: {groupBy}")
        };
    }

    #endregion

    private void EnsureInitialized()
    {
        if (!_isInitialized)
        {
            throw new InvalidOperationException(
                "DataLakeService must be initialized before use. Call InitializeAsync() first.");
        }
    }
}
