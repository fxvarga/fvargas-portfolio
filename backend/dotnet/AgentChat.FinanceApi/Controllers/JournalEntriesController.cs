using Microsoft.AspNetCore.Mvc;
using AgentChat.FinanceApi.Models;
using AgentChat.FinanceApi.Services;

namespace AgentChat.FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JournalEntriesController : ControllerBase
{
    private readonly IFinanceService _financeService;

    public JournalEntriesController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    /// <summary>
    /// Get a journal entry by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<JournalEntry>> Get(string id)
    {
        var entry = await _financeService.GetJournalEntryAsync(id);
        if (entry == null)
            return NotFound(new { message = $"Journal entry {id} not found" });
        return Ok(entry);
    }

    /// <summary>
    /// Query journal entries
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<JournalEntry>>> Query(
        [FromQuery] string? entityCode = null,
        [FromQuery] int? fiscalYear = null,
        [FromQuery] int? fiscalPeriod = null,
        [FromQuery] string? status = null,
        [FromQuery] string? entryType = null)
    {
        var entries = await _financeService.QueryJournalEntriesAsync(entityCode, fiscalYear, fiscalPeriod, status, entryType);
        return Ok(entries);
    }

    /// <summary>
    /// Create a new journal entry
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<JournalEntryResponse>> Create([FromBody] CreateJournalEntryRequest request)
    {
        var response = await _financeService.CreateJournalEntryAsync(request);
        if (!response.Success)
            return BadRequest(response);
        return CreatedAtAction(nameof(Get), new { id = response.Entry!.Id }, response);
    }

    /// <summary>
    /// Update journal entry status
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<JournalEntryResponse>> UpdateStatus(
        string id,
        [FromBody] UpdateStatusRequest request)
    {
        var response = await _financeService.UpdateJournalEntryStatusAsync(id, request.Status, request.UpdatedBy);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Post a journal entry
    /// </summary>
    [HttpPost("{id}/post")]
    public async Task<ActionResult<JournalEntryResponse>> Post(
        string id,
        [FromBody] PostRequest request)
    {
        var response = await _financeService.PostJournalEntryAsync(id, request.PostedBy);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Reverse a journal entry
    /// </summary>
    [HttpPost("{id}/reverse")]
    public async Task<ActionResult<JournalEntryResponse>> Reverse(
        string id,
        [FromBody] ReverseRequest request)
    {
        var response = await _financeService.ReverseJournalEntryAsync(id, request.ReversalDate, request.ReversedBy);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
}

public class PostRequest
{
    public string PostedBy { get; set; } = string.Empty;
}

public class ReverseRequest
{
    public DateTime ReversalDate { get; set; }
    public string ReversedBy { get; set; } = string.Empty;
}
