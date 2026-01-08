using Microsoft.AspNetCore.Mvc;
using AgentChat.FinanceApi.Models;
using AgentChat.FinanceApi.Services;

namespace AgentChat.FinanceApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApprovalsController : ControllerBase
{
    private readonly IFinanceService _financeService;

    public ApprovalsController(IFinanceService financeService)
    {
        _financeService = financeService;
    }

    /// <summary>
    /// Get an approval by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Approval>> Get(string id)
    {
        var approval = await _financeService.GetApprovalAsync(id);
        if (approval == null)
            return NotFound(new { message = $"Approval {id} not found" });
        return Ok(approval);
    }

    /// <summary>
    /// Query approvals
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<Approval>>> Query(
        [FromQuery] string? entityCode = null,
        [FromQuery] string? assignedTo = null,
        [FromQuery] string? status = null,
        [FromQuery] string? approvalType = null)
    {
        var approvals = await _financeService.QueryApprovalsAsync(entityCode, assignedTo, status, approvalType);
        return Ok(approvals);
    }

    /// <summary>
    /// Create a new approval request
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApprovalResponse>> Create([FromBody] CreateApprovalRequest request)
    {
        var response = await _financeService.CreateApprovalAsync(request);
        if (!response.Success)
            return BadRequest(response);
        return CreatedAtAction(nameof(Get), new { id = response.Approval!.Id }, response);
    }

    /// <summary>
    /// Process an approval (approve, reject, escalate, reassign)
    /// </summary>
    [HttpPost("{id}/process")]
    public async Task<ActionResult<ApprovalResponse>> Process(
        string id,
        [FromBody] ProcessApprovalRequest request)
    {
        var response = await _financeService.ProcessApprovalAsync(id, request);
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Approve an approval request
    /// </summary>
    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApprovalResponse>> Approve(
        string id,
        [FromBody] ApproveRequest request)
    {
        var response = await _financeService.ProcessApprovalAsync(id, new ProcessApprovalRequest
        {
            Action = "APPROVE",
            DecidedBy = request.ApprovedBy,
            Comments = request.Comments
        });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Reject an approval request
    /// </summary>
    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApprovalResponse>> Reject(
        string id,
        [FromBody] RejectRequest request)
    {
        var response = await _financeService.ProcessApprovalAsync(id, new ProcessApprovalRequest
        {
            Action = "REJECT",
            DecidedBy = request.RejectedBy,
            Comments = request.Reason
        });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Escalate an approval request
    /// </summary>
    [HttpPost("{id}/escalate")]
    public async Task<ActionResult<ApprovalResponse>> Escalate(
        string id,
        [FromBody] EscalateRequest request)
    {
        var response = await _financeService.ProcessApprovalAsync(id, new ProcessApprovalRequest
        {
            Action = "ESCALATE",
            DecidedBy = request.EscalatedBy,
            Comments = request.Reason
        });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Reassign an approval request
    /// </summary>
    [HttpPost("{id}/reassign")]
    public async Task<ActionResult<ApprovalResponse>> Reassign(
        string id,
        [FromBody] ReassignRequest request)
    {
        var response = await _financeService.ProcessApprovalAsync(id, new ProcessApprovalRequest
        {
            Action = "REASSIGN",
            DecidedBy = request.ReassignedBy,
            ReassignTo = request.ReassignTo,
            Comments = request.Reason
        });
        if (!response.Success)
            return BadRequest(response);
        return Ok(response);
    }

    /// <summary>
    /// Get pending approvals for a user
    /// </summary>
    [HttpGet("pending/{assignedTo}")]
    public async Task<ActionResult<List<Approval>>> GetPending(string assignedTo)
    {
        var approvals = await _financeService.QueryApprovalsAsync(assignedTo: assignedTo, status: "PENDING");
        return Ok(approvals);
    }
}

public class ApproveRequest
{
    public string ApprovedBy { get; set; } = string.Empty;
    public string? Comments { get; set; }
}

public class RejectRequest
{
    public string RejectedBy { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class EscalateRequest
{
    public string EscalatedBy { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}

public class ReassignRequest
{
    public string ReassignedBy { get; set; } = string.Empty;
    public string ReassignTo { get; set; } = string.Empty;
    public string? Reason { get; set; }
}
