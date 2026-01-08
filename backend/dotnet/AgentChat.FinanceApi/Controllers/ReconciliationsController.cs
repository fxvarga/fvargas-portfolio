using Microsoft.AspNetCore.Mvc;
using AgentChat.FinanceApi.Models;
using AgentChat.FinanceApi.Services;

namespace AgentChat.FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReconciliationsController : ControllerBase
{
    private readonly IFinanceService _financeService;

    public ReconciliationsController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    /// <summary>
    /// Get a reconciliation by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Reconciliation>> Get(string id)
    {
        var rec = await _financeService.GetReconciliationAsync(id);
        if (rec == null)
            return NotFound(new { message = $"Reconciliation {id} not found" });
        return Ok(rec);
    }

    /// <summary>
    /// Query reconciliations
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<Reconciliation>>> Query(
        [FromQuery] string? entityCode = null,
        [FromQuery] int? fiscalYear = null,
        [FromQuery] int? fiscalPeriod = null,
        [FromQuery] string? status = null,
        [FromQuery] string? reconciliationType = null)
    {
        var recs = await _financeService.QueryReconciliationsAsync(entityCode, fiscalYear, fiscalPeriod, status, reconciliationType);
        return Ok(recs);
    }

    /// <summary>
    /// Create a new reconciliation
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReconciliationResponse>> Create([FromBody] CreateReconciliationRequest request)
    {
        var response = await _financeService.CreateReconciliationAsync(request);
        if (!response.Success)
            return BadRequest(response);
        return CreatedAtAction(nameof(Get), new { id = response.Reconciliation!.Id }, response);
    }

    /// <summary>
    /// Update a reconciliation
    /// </summary>
    [HttpPatch("{id}")]
    public async Task<ActionResult<ReconciliationResponse>> Update(
        string id,
        [FromBody] UpdateReconciliationRequest request)
    {
        var response = await _financeService.UpdateReconciliationAsync(
            id, 
            request.Status, 
            request.ReconcilingItem, 
            request.ReviewedBy, 
            request.ApprovedBy);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Add a reconciling item
    /// </summary>
    [HttpPost("{id}/reconciling-items")]
    public async Task<ActionResult<ReconciliationResponse>> AddReconcilingItem(
        string id,
        [FromBody] ReconcilingItem item)
    {
        var response = await _financeService.UpdateReconciliationAsync(id, reconcilingItem: item);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }
}

public class UpdateReconciliationRequest
{
    public string? Status { get; set; }
    public ReconcilingItem? ReconcilingItem { get; set; }
    public string? ReviewedBy { get; set; }
    public string? ApprovedBy { get; set; }
}
