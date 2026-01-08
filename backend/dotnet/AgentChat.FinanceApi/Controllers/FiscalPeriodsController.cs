using Microsoft.AspNetCore.Mvc;
using AgentChat.FinanceApi.Models;
using AgentChat.FinanceApi.Services;

namespace AgentChat.FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FiscalPeriodsController : ControllerBase
{
    private readonly IFinanceService _financeService;

    public FiscalPeriodsController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    /// <summary>
    /// Get a fiscal period
    /// </summary>
    [HttpGet("{entityCode}/{fiscalYear}/{period}")]
    public async Task<ActionResult<FiscalPeriod>> Get(string entityCode, int fiscalYear, int period)
    {
        var fp = await _financeService.GetFiscalPeriodAsync(entityCode, fiscalYear, period);
        if (fp == null)
            return NotFound(new { message = $"Fiscal period {entityCode}/{fiscalYear}/{period} not found" });
        return Ok(fp);
    }

    /// <summary>
    /// Query fiscal periods
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FiscalPeriod>>> Query(
        [FromQuery] string? entityCode = null,
        [FromQuery] int? fiscalYear = null)
    {
        var periods = await _financeService.GetFiscalPeriodsAsync(entityCode, fiscalYear);
        return Ok(periods);
    }

    /// <summary>
    /// Update fiscal period status
    /// </summary>
    [HttpPatch("{entityCode}/{fiscalYear}/{period}")]
    public async Task<ActionResult<FiscalPeriodResponse>> Update(
        string entityCode,
        int fiscalYear,
        int period,
        [FromBody] UpdateFiscalPeriodRequest request)
    {
        var response = await _financeService.UpdateFiscalPeriodAsync(entityCode, fiscalYear, period, request);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Close subledger for a period
    /// </summary>
    [HttpPost("{entityCode}/{fiscalYear}/{period}/subledger/{subledger}/close")]
    public async Task<ActionResult<FiscalPeriodResponse>> CloseSubledger(
        string entityCode,
        int fiscalYear,
        int period,
        string subledger,
        [FromBody] CloseSubledgerRequest request)
    {
        var response = await _financeService.UpdateFiscalPeriodAsync(entityCode, fiscalYear, period,
            new UpdateFiscalPeriodRequest
            {
                Subledger = subledger,
                SubledgerStatus = "CLOSED",
                UpdatedBy = request.ClosedBy
            });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Soft close a period
    /// </summary>
    [HttpPost("{entityCode}/{fiscalYear}/{period}/soft-close")]
    public async Task<ActionResult<FiscalPeriodResponse>> SoftClose(
        string entityCode,
        int fiscalYear,
        int period,
        [FromBody] ClosePeriodRequest request)
    {
        var response = await _financeService.UpdateFiscalPeriodAsync(entityCode, fiscalYear, period,
            new UpdateFiscalPeriodRequest
            {
                Status = "SOFT_CLOSE",
                UpdatedBy = request.ClosedBy
            });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Hard close a period
    /// </summary>
    [HttpPost("{entityCode}/{fiscalYear}/{period}/hard-close")]
    public async Task<ActionResult<FiscalPeriodResponse>> HardClose(
        string entityCode,
        int fiscalYear,
        int period,
        [FromBody] ClosePeriodRequest request)
    {
        var response = await _financeService.UpdateFiscalPeriodAsync(entityCode, fiscalYear, period,
            new UpdateFiscalPeriodRequest
            {
                Status = "HARD_CLOSE",
                UpdatedBy = request.ClosedBy
            });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Lock a period
    /// </summary>
    [HttpPost("{entityCode}/{fiscalYear}/{period}/lock")]
    public async Task<ActionResult<FiscalPeriodResponse>> Lock(
        string entityCode,
        int fiscalYear,
        int period,
        [FromBody] ClosePeriodRequest request)
    {
        var response = await _financeService.UpdateFiscalPeriodAsync(entityCode, fiscalYear, period,
            new UpdateFiscalPeriodRequest
            {
                Status = "LOCKED",
                UpdatedBy = request.ClosedBy
            });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Reopen a period
    /// </summary>
    [HttpPost("{entityCode}/{fiscalYear}/{period}/reopen")]
    public async Task<ActionResult<FiscalPeriodResponse>> Reopen(
        string entityCode,
        int fiscalYear,
        int period,
        [FromBody] ReopenPeriodRequest request)
    {
        var response = await _financeService.UpdateFiscalPeriodAsync(entityCode, fiscalYear, period,
            new UpdateFiscalPeriodRequest
            {
                Status = "OPEN",
                UpdatedBy = request.ReopenedBy,
                Reason = request.Reason
            });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }
}

public class CloseSubledgerRequest
{
    public string ClosedBy { get; set; } = string.Empty;
}

public class ClosePeriodRequest
{
    public string ClosedBy { get; set; } = string.Empty;
}

public class ReopenPeriodRequest
{
    public string ReopenedBy { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
