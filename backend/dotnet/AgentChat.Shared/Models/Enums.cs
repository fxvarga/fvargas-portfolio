namespace AgentChat.Shared.Models;

/// <summary>
/// Risk tier for tool execution - determines if approval is required
/// </summary>
public enum RiskTier
{
    /// <summary>Read-only operations, no approval required</summary>
    Low,
    
    /// <summary>Minor write operations, may require approval</summary>
    Medium,
    
    /// <summary>Significant write operations, requires approval</summary>
    High,
    
    /// <summary>Dangerous operations, always requires approval</summary>
    Critical
}

/// <summary>
/// Status of a run
/// </summary>
public enum RunStatus
{
    Pending,
    Running,
    WaitingApproval,
    WaitingInput,
    Completed,
    Failed,
    Cancelled
}

/// <summary>
/// Status of a step within a run
/// </summary>
public enum StepStatus
{
    Pending,
    Running,
    WaitingApproval,
    Completed,
    Failed
}

/// <summary>
/// Type of step
/// </summary>
public enum StepType
{
    UserMessage,
    LlmCall,
    ToolCall
}

/// <summary>
/// Approval decision
/// </summary>
public enum ApprovalDecision
{
    Approve,
    Reject,
    EditApprove
}

/// <summary>
/// Status of an approval request
/// </summary>
public enum ApprovalStatus
{
    Pending,
    Resolved,
    Expired
}

/// <summary>
/// Reason for run completion
/// </summary>
public enum RunCompletionReason
{
    Natural,
    MaxStepsReached,
    UserCancelled,
    Timeout,
    Error
}
