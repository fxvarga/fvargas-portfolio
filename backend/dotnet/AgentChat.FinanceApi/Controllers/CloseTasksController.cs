using Microsoft.AspNetCore.Mvc;
using AgentChat.FinanceApi.Models;
using AgentChat.FinanceApi.Services;

namespace AgentChat.FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CloseTasksController : ControllerBase
{
    private readonly IFinanceService _financeService;

    public CloseTasksController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    /// <summary>
    /// Get a close task by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CloseTask>> Get(string id)
    {
        var task = await _financeService.GetCloseTaskAsync(id);
        if (task == null)
            return NotFound(new { message = $"Close task {id} not found" });
        return Ok(task);
    }

    /// <summary>
    /// Query close tasks
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CloseTask>>> Query(
        [FromQuery] string? entityCode = null,
        [FromQuery] int? fiscalYear = null,
        [FromQuery] int? fiscalPeriod = null,
        [FromQuery] string? status = null,
        [FromQuery] string? category = null,
        [FromQuery] string? assignedTo = null)
    {
        var tasks = await _financeService.QueryCloseTasksAsync(entityCode, fiscalYear, fiscalPeriod, status, category, assignedTo);
        return Ok(tasks);
    }

    /// <summary>
    /// Update a close task
    /// </summary>
    [HttpPatch("{id}")]
    public async Task<ActionResult<CloseTaskResponse>> Update(
        string id,
        [FromBody] UpdateCloseTaskRequest request)
    {
        var response = await _financeService.UpdateCloseTaskAsync(id, request);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Start a close task
    /// </summary>
    [HttpPost("{id}/start")]
    public async Task<ActionResult<CloseTaskResponse>> Start(string id)
    {
        var response = await _financeService.UpdateCloseTaskAsync(id, new UpdateCloseTaskRequest { Status = "IN_PROGRESS" });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Complete a close task
    /// </summary>
    [HttpPost("{id}/complete")]
    public async Task<ActionResult<CloseTaskResponse>> Complete(
        string id,
        [FromBody] CompleteTaskRequest request)
    {
        var response = await _financeService.UpdateCloseTaskAsync(id, new UpdateCloseTaskRequest 
        { 
            Status = "COMPLETED", 
            CompletedBy = request.CompletedBy,
            Notes = request.Notes
        });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Report a blocking issue
    /// </summary>
    [HttpPost("{id}/block")]
    public async Task<ActionResult<CloseTaskResponse>> Block(
        string id,
        [FromBody] BlockingIssue issue)
    {
        var response = await _financeService.UpdateCloseTaskAsync(id, new UpdateCloseTaskRequest { BlockingIssue = issue });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Get close status for a period
    /// </summary>
    [HttpGet("status/{entityCode}/{fiscalYear}/{fiscalPeriod}")]
    public async Task<ActionResult<CloseStatus>> GetCloseStatus(string entityCode, int fiscalYear, int fiscalPeriod)
    {
        var status = await _financeService.GetCloseStatusAsync(entityCode, fiscalYear, fiscalPeriod);
        return Ok(status);
    }
}

public class CompleteTaskRequest
{
    public string CompletedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
