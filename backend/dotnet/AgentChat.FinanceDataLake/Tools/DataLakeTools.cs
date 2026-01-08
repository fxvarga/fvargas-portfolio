using System.Text.Json;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Models;
using AgentChat.FinanceDataLake.Services;

namespace AgentChat.FinanceDataLake.Tools;

/// <summary>
/// Tool for querying general ledger balances from the data lake.
/// </summary>
public class GlBalanceQueryTool : ITool
{
    private readonly IDataLakeService _dataLake;

    public GlBalanceQueryTool(IDataLakeService dataLake)
    {
        _dataLake = dataLake;
    }

    public ToolDefinition Definition => new()
    {
        Name = "datalake_gl_query",
        Description = "Query general ledger balances from the finance data lake. " +
                      "Returns account balances by entity, period, account, and cost center. " +
                      "Use for retrieving trial balance data, account balances, and period activity.",
        Category = "datalake",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": {
                    "type": "string",
                    "description": "Legal entity code (e.g., US01, UK01, DE01)"
                },
                "fiscal_year": {
                    "type": "integer",
                    "description": "Fiscal year (e.g., 2024)"
                },
                "fiscal_period": {
                    "type": "integer",
                    "description": "Fiscal period 1-12"
                },
                "account_number": {
                    "type": "string",
                    "description": "Account number or prefix to filter"
                },
                "account_type": {
                    "type": "string",
                    "description": "Account type: Asset, Liability, Equity, Revenue, Expense"
                },
                "cost_center": {
                    "type": "string",
                    "description": "Cost center code"
                }
            }
        }
        """).RootElement,
        Tags = ["datalake", "gl", "query", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _dataLake.InitializeAsync();

            string? entityCode = args.TryGetProperty("entity_code", out var ec) ? ec.GetString() : null;
            int? fiscalYear = args.TryGetProperty("fiscal_year", out var fy) ? fy.GetInt32() : null;
            int? fiscalPeriod = args.TryGetProperty("fiscal_period", out var fp) ? fp.GetInt32() : null;
            string? accountNumber = args.TryGetProperty("account_number", out var an) ? an.GetString() : null;
            string? accountType = args.TryGetProperty("account_type", out var at) ? at.GetString() : null;
            string? costCenter = args.TryGetProperty("cost_center", out var cc) ? cc.GetString() : null;

            var balances = _dataLake.QueryGlBalances(
                entityCode, fiscalYear, fiscalPeriod, accountNumber, accountType, costCenter);

            var results = balances.Select(b => new
            {
                entity_code = b.EntityCode,
                fiscal_year = b.FiscalYear,
                fiscal_period = b.FiscalPeriod,
                account_number = b.AccountNumber,
                account_name = b.AccountName,
                account_type = b.AccountType,
                cost_center = b.CostCenter,
                currency = b.Currency,
                opening_balance = b.OpeningBalance,
                period_debits = b.PeriodDebits,
                period_credits = b.PeriodCredits,
                closing_balance = b.ClosingBalance
            }).ToList();

            var result = JsonSerializer.SerializeToElement(new
            {
                total_count = results.Count,
                total_debit = results.Sum(r => r.period_debits),
                total_credit = results.Sum(r => r.period_credits),
                balances = results
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error querying GL balances: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for querying fixed assets from the data lake.
/// </summary>
public class FixedAssetQueryTool : ITool
{
    private readonly IDataLakeService _dataLake;

    public FixedAssetQueryTool(IDataLakeService dataLake)
    {
        _dataLake = dataLake;
    }

    public ToolDefinition Definition => new()
    {
        Name = "datalake_fixed_asset_query",
        Description = "Query fixed assets from the finance data lake. " +
                      "Returns asset details including cost, depreciation, and book value. " +
                      "Use for depreciation calculations and asset reporting.",
        Category = "datalake",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": {
                    "type": "string",
                    "description": "Legal entity code"
                },
                "asset_class": {
                    "type": "string",
                    "description": "Asset class: machinery_and_equipment, buildings, vehicles, computer_hardware"
                },
                "status": {
                    "type": "string",
                    "description": "Asset status: active, disposed, fully_depreciated"
                },
                "asset_id": {
                    "type": "string",
                    "description": "Specific asset ID to retrieve"
                }
            }
        }
        """).RootElement,
        Tags = ["datalake", "fixed_assets", "query", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _dataLake.InitializeAsync();

            // Check for specific asset lookup
            if (args.TryGetProperty("asset_id", out var assetIdEl))
            {
                var asset = _dataLake.GetFixedAsset(assetIdEl.GetString() ?? "");
                if (asset == null)
                {
                    return ToolExecutionResult.Fail("Asset not found", DateTime.UtcNow - startTime);
                }

                var result = JsonSerializer.SerializeToElement(asset);
                return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
            }

            string? entityCode = args.TryGetProperty("entity_code", out var ec) ? ec.GetString() : null;
            string? assetClass = args.TryGetProperty("asset_class", out var ac) ? ac.GetString() : null;
            string? status = args.TryGetProperty("status", out var st) ? st.GetString() : null;

            var assets = _dataLake.QueryFixedAssets(entityCode, assetClass, status);

            var results = assets.Select(a => new
            {
                asset_id = a.AssetId,
                entity_code = a.EntityCode,
                asset_number = a.AssetNumber,
                description = a.Description,
                asset_class = a.AssetClass,
                original_cost = a.OriginalCost,
                accumulated_depreciation = a.AccumulatedDepreciation,
                net_book_value = a.NetBookValue,
                monthly_depreciation = a.MonthlyDepreciation,
                useful_life_years = a.UsefulLifeYears,
                status = a.Status
            }).ToList();

            var result2 = JsonSerializer.SerializeToElement(new
            {
                total_count = results.Count,
                total_original_cost = results.Sum(r => r.original_cost),
                total_accumulated_depreciation = results.Sum(r => r.accumulated_depreciation),
                total_net_book_value = results.Sum(r => r.net_book_value),
                total_monthly_depreciation = results.Sum(r => r.monthly_depreciation),
                assets = results
            });

            return ToolExecutionResult.Ok(result2, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error querying fixed assets: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for querying lease schedules from the data lake.
/// </summary>
public class LeaseQueryTool : ITool
{
    private readonly IDataLakeService _dataLake;

    public LeaseQueryTool(IDataLakeService dataLake)
    {
        _dataLake = dataLake;
    }

    public ToolDefinition Definition => new()
    {
        Name = "datalake_lease_query",
        Description = "Query lease schedules from the finance data lake. " +
                      "Returns ASC 842 compliant lease data including ROU assets and liabilities. " +
                      "Use for rent accruals and lease accounting.",
        Category = "datalake",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "entity_code": {
                    "type": "string",
                    "description": "Legal entity code"
                },
                "lease_type": {
                    "type": "string",
                    "description": "Lease type: operating, finance"
                },
                "status": {
                    "type": "string",
                    "description": "Lease status: active, expired, terminated"
                },
                "lease_id": {
                    "type": "string",
                    "description": "Specific lease ID to retrieve"
                }
            }
        }
        """).RootElement,
        Tags = ["datalake", "leases", "asc842", "query", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _dataLake.InitializeAsync();

            if (args.TryGetProperty("lease_id", out var leaseIdEl))
            {
                var lease = _dataLake.GetLease(leaseIdEl.GetString() ?? "");
                if (lease == null)
                {
                    return ToolExecutionResult.Fail("Lease not found", DateTime.UtcNow - startTime);
                }

                var result = JsonSerializer.SerializeToElement(lease);
                return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
            }

            string? entityCode = args.TryGetProperty("entity_code", out var ec) ? ec.GetString() : null;
            string? leaseType = args.TryGetProperty("lease_type", out var lt) ? lt.GetString() : null;
            string? status = args.TryGetProperty("status", out var st) ? st.GetString() : null;

            var leases = _dataLake.QueryLeases(entityCode, leaseType, status);

            var results = leases.Select(l => new
            {
                lease_id = l.LeaseId,
                entity_code = l.EntityCode,
                lease_number = l.LeaseNumber,
                description = l.Description,
                lease_type = l.LeaseType,
                vendor_name = l.VendorName,
                base_rent_monthly = l.BaseRentMonthly,
                rou_asset_current = l.RouAssetCurrent,
                lease_liability_current = l.LeaseLiabilityCurrent,
                monthly_lease_expense = l.MonthlyLeaseExpense,
                termination_date = l.TerminationDate,
                status = l.Status
            }).ToList();

            var result2 = JsonSerializer.SerializeToElement(new
            {
                total_count = results.Count,
                total_rou_assets = results.Sum(r => r.rou_asset_current),
                total_lease_liabilities = results.Sum(r => r.lease_liability_current),
                total_monthly_expense = results.Sum(r => r.monthly_lease_expense),
                leases = results
            });

            return ToolExecutionResult.Ok(result2, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error querying leases: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for querying intercompany balances from the data lake.
/// </summary>
public class IntercompanyQueryTool : ITool
{
    private readonly IDataLakeService _dataLake;

    public IntercompanyQueryTool(IDataLakeService dataLake)
    {
        _dataLake = dataLake;
    }

    public ToolDefinition Definition => new()
    {
        Name = "datalake_intercompany_query",
        Description = "Query intercompany balances from the finance data lake. " +
                      "Returns IC receivables/payables with reconciliation status. " +
                      "Use for intercompany reconciliation and elimination.",
        Category = "datalake",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "reporting_entity": {
                    "type": "string",
                    "description": "Reporting entity code"
                },
                "counterparty_entity": {
                    "type": "string",
                    "description": "Counterparty entity code"
                },
                "fiscal_period": {
                    "type": "string",
                    "description": "Fiscal period (YYYY-MM format)"
                },
                "reconciliation_status": {
                    "type": "string",
                    "description": "Status: pending, matched, unmatched"
                }
            }
        }
        """).RootElement,
        Tags = ["datalake", "intercompany", "query", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _dataLake.InitializeAsync();

            string? reportingEntity = args.TryGetProperty("reporting_entity", out var re) ? re.GetString() : null;
            string? counterpartyEntity = args.TryGetProperty("counterparty_entity", out var ce) ? ce.GetString() : null;
            string? fiscalPeriod = args.TryGetProperty("fiscal_period", out var fp) ? fp.GetString() : null;
            string? reconciliationStatus = args.TryGetProperty("reconciliation_status", out var rs) ? rs.GetString() : null;

            var balances = _dataLake.QueryIntercompanyBalances(
                reportingEntity, counterpartyEntity, fiscalPeriod, reconciliationStatus);

            var results = balances.Select(b => new
            {
                balance_id = b.BalanceId,
                reporting_entity = b.ReportingEntity,
                counterparty_entity = b.CounterpartyEntity,
                fiscal_period = b.FiscalPeriod,
                transaction_type = b.TransactionType,
                local_currency = b.LocalCurrency,
                local_amount = b.LocalAmount,
                reporting_amount = b.ReportingAmount,
                counterparty_amount = b.CounterpartyAmount,
                difference = b.Difference,
                reconciliation_status = b.ReconciliationStatus
            }).ToList();

            var result = JsonSerializer.SerializeToElement(new
            {
                total_count = results.Count,
                matched_count = results.Count(r => r.reconciliation_status == "matched"),
                unmatched_count = results.Count(r => r.reconciliation_status == "unmatched"),
                total_difference = results.Sum(r => r.difference ?? 0),
                balances = results
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error querying intercompany balances: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}

/// <summary>
/// Tool for getting FX rates from the data lake.
/// </summary>
public class FxRateQueryTool : ITool
{
    private readonly IDataLakeService _dataLake;

    public FxRateQueryTool(IDataLakeService dataLake)
    {
        _dataLake = dataLake;
    }

    public ToolDefinition Definition => new()
    {
        Name = "datalake_fx_rate_query",
        Description = "Query foreign exchange rates from the data lake. " +
                      "Returns spot, average, or historical rates for currency translation. " +
                      "Use for FX revaluation and translation procedures.",
        Category = "datalake",
        RiskTier = RiskTier.Low,
        ParametersSchema = JsonDocument.Parse("""
        {
            "type": "object",
            "properties": {
                "from_currency": {
                    "type": "string",
                    "description": "Source currency code (e.g., GBP, EUR)"
                },
                "to_currency": {
                    "type": "string",
                    "description": "Target currency code (default: USD)"
                },
                "rate_date": {
                    "type": "string",
                    "description": "Rate date (YYYY-MM-DD format)"
                },
                "rate_type": {
                    "type": "string",
                    "description": "Rate type: spot, average, historical"
                }
            },
            "required": ["from_currency", "rate_date"]
        }
        """).RootElement,
        Tags = ["datalake", "fx", "rates", "query", "read-only"]
    };

    public async Task<ToolExecutionResult> ExecuteAsync(
        JsonElement args,
        ToolExecutionContext context,
        CancellationToken cancellationToken = default)
    {
        var startTime = DateTime.UtcNow;

        try
        {
            await _dataLake.InitializeAsync();

            var fromCurrency = args.GetProperty("from_currency").GetString() ?? "";
            var toCurrency = args.TryGetProperty("to_currency", out var tc) ? tc.GetString() ?? "USD" : "USD";
            var rateDateStr = args.GetProperty("rate_date").GetString() ?? "";
            var rateType = args.TryGetProperty("rate_type", out var rt) ? rt.GetString() ?? "spot" : "spot";

            if (!DateTime.TryParse(rateDateStr, out var rateDate))
            {
                return ToolExecutionResult.Fail("Invalid rate_date format", DateTime.UtcNow - startTime);
            }

            var fxRate = _dataLake.GetFxRate(fromCurrency, toCurrency, rateDate, rateType);

            if (fxRate == null)
            {
                return ToolExecutionResult.Fail(
                    $"No {rateType} rate found for {fromCurrency}/{toCurrency} on or before {rateDateStr}",
                    DateTime.UtcNow - startTime);
            }

            var result = JsonSerializer.SerializeToElement(new
            {
                from_currency = fxRate.FromCurrency,
                to_currency = fxRate.ToCurrency,
                rate_date = fxRate.RateDate.ToString("yyyy-MM-dd"),
                rate_type = fxRate.RateType,
                rate = fxRate.Rate,
                source = fxRate.Source
            });

            return ToolExecutionResult.Ok(result, DateTime.UtcNow - startTime);
        }
        catch (Exception ex)
        {
            return ToolExecutionResult.Fail($"Error querying FX rates: {ex.Message}", DateTime.UtcNow - startTime);
        }
    }
}
