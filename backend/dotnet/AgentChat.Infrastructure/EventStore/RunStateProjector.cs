using AgentChat.Shared.Contracts;
using AgentChat.Shared.Events;
using AgentChat.Shared.Models;

namespace AgentChat.Infrastructure.EventStore;

/// <summary>
/// Projects run state from events
/// </summary>
public class RunStateProjector : IRunStateProjector
{
    private readonly IEventStore _eventStore;

    public RunStateProjector(IEventStore eventStore)
    {
        _eventStore = eventStore;
    }

    public async Task<RunState> ProjectAsync(Guid runId, CancellationToken cancellationToken = default)
    {
        var state = new RunState { RunId = runId };
        
        await foreach (var stored in _eventStore.LoadEventsAsync(runId, cancellationToken: cancellationToken))
        {
            state = Apply(state, stored.Event);
            state = state with { LastEventSequence = stored.Sequence };
        }

        return state;
    }

    public RunState Apply(RunState state, IRunEvent evt)
    {
        return evt switch
        {
            RunStartedEvent e => ApplyRunStarted(state, e),
            RunWaitingInputEvent e => ApplyRunWaitingInput(state, e),
            RunCompletedEvent e => ApplyRunCompleted(state, e),
            RunFailedEvent e => ApplyRunFailed(state, e),
            MessageUserCreatedEvent e => ApplyUserMessage(state, e),
            MessageAssistantCreatedEvent e => ApplyAssistantMessage(state, e),
            LlmStartedEvent e => ApplyLlmStarted(state, e),
            LlmDeltaEvent e => ApplyLlmDelta(state, e),
            LlmCompletedEvent e => ApplyLlmCompleted(state, e),
            ToolCallRequestedEvent e => ApplyToolCallRequested(state, e),
            ToolCallStartedEvent e => ApplyToolCallStarted(state, e),
            ToolCallCompletedEvent e => ApplyToolCallCompleted(state, e),
            ApprovalRequestedEvent e => ApplyApprovalRequested(state, e),
            ApprovalResolvedEvent e => ApplyApprovalResolved(state, e),
            ArtifactCreatedEvent e => ApplyArtifactCreated(state, e),
            _ => state
        };
    }

    private static RunState ApplyRunStarted(RunState state, RunStartedEvent e) =>
        state with
        {
            TenantId = e.TenantId,
            UserId = e.UserId,
            Status = RunStatus.Running,
            CreatedAt = e.Timestamp,
            UpdatedAt = e.Timestamp
        };

    private static RunState ApplyRunWaitingInput(RunState state, RunWaitingInputEvent e) =>
        state with
        {
            Status = RunStatus.WaitingInput,
            UpdatedAt = e.Timestamp
        };

    private static RunState ApplyRunCompleted(RunState state, RunCompletedEvent e) =>
        state with
        {
            Status = RunStatus.Completed,
            TotalTokens = e.TotalTokens,
            UpdatedAt = e.Timestamp
        };

    private static RunState ApplyRunFailed(RunState state, RunFailedEvent e) =>
        state with
        {
            Status = RunStatus.Failed,
            LastError = e.Error,
            UpdatedAt = e.Timestamp
        };

    private static RunState ApplyUserMessage(RunState state, MessageUserCreatedEvent e)
    {
        var message = new MessageState
        {
            Id = e.MessageId,
            Role = "user",
            Content = e.Content,
            Timestamp = e.Timestamp
        };
        return state with
        {
            Messages = [..state.Messages, message],
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyAssistantMessage(RunState state, MessageAssistantCreatedEvent e)
    {
        var citations = e.Citations?.Select(c => new CitationState
        {
            SourceId = c.SourceId,
            Title = c.Title,
            Uri = c.Uri,
            ChunkText = c.ChunkText,
            Score = c.Score
        }).ToList() ?? [];

        var message = new MessageState
        {
            Id = e.MessageId,
            Role = "assistant",
            Content = e.Content,
            Citations = citations,
            Timestamp = e.Timestamp
        };
        return state with
        {
            Messages = [..state.Messages, message],
            StreamingContent = string.Empty,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyLlmStarted(RunState state, LlmStartedEvent e)
    {
        var step = new StepState
        {
            Id = e.StepId ?? Guid.NewGuid(),
            SequenceNumber = state.Steps.Count + 1,
            Type = StepType.LlmCall,
            Status = StepStatus.Running,
            StartedAt = e.Timestamp
        };
        return state with
        {
            Steps = [..state.Steps, step],
            CurrentStepId = step.Id,
            StreamingContent = string.Empty,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyLlmDelta(RunState state, LlmDeltaEvent e) =>
        state with
        {
            StreamingContent = state.StreamingContent + e.Delta,
            UpdatedAt = e.Timestamp
        };

    private static RunState ApplyLlmCompleted(RunState state, LlmCompletedEvent e)
    {
        var steps = state.Steps.Select(s =>
            s.Id == e.StepId
                ? s with { Status = StepStatus.Completed, CompletedAt = e.Timestamp }
                : s
        ).ToList();

        return state with
        {
            Steps = steps,
            TotalTokens = state.TotalTokens + e.InputTokens + e.OutputTokens,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyToolCallRequested(RunState state, ToolCallRequestedEvent e)
    {
        var toolCall = new ToolCallState
        {
            Id = e.ToolCallId,
            StepId = e.StepId ?? Guid.Empty,
            ToolName = e.ToolName,
            Args = e.Args,
            RiskTier = e.RiskTier,
            Status = e.RequiresApproval ? "pending_approval" : "pending",
            IdempotencyKey = e.IdempotencyKey,
            StartedAt = e.Timestamp
        };

        var step = new StepState
        {
            Id = e.StepId ?? Guid.NewGuid(),
            SequenceNumber = state.Steps.Count + 1,
            Type = StepType.ToolCall,
            Status = e.RequiresApproval ? StepStatus.WaitingApproval : StepStatus.Pending
        };

        return state with
        {
            ToolCalls = [..state.ToolCalls, toolCall],
            Steps = [..state.Steps, step],
            CurrentStepId = step.Id,
            HasPendingApproval = e.RequiresApproval || state.HasPendingApproval,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyToolCallStarted(RunState state, ToolCallStartedEvent e)
    {
        var toolCalls = state.ToolCalls.Select(tc =>
            tc.Id == e.ToolCallId
                ? tc with { Status = "running" }
                : tc
        ).ToList();

        var steps = state.Steps.Select(s =>
            s.Id == e.StepId
                ? s with { Status = StepStatus.Running, StartedAt = e.Timestamp }
                : s
        ).ToList();

        return state with
        {
            ToolCalls = toolCalls,
            Steps = steps,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyToolCallCompleted(RunState state, ToolCallCompletedEvent e)
    {
        var toolCalls = state.ToolCalls.Select(tc =>
            tc.Id == e.ToolCallId
                ? tc with
                {
                    Status = e.Success ? "completed" : "failed",
                    Result = e.Output,
                    Error = e.Error,
                    Duration = e.Duration
                }
                : tc
        ).ToList();

        var steps = state.Steps.Select(s =>
            s.Id == e.StepId
                ? s with { Status = e.Success ? StepStatus.Completed : StepStatus.Failed, CompletedAt = e.Timestamp }
                : s
        ).ToList();

        return state with
        {
            ToolCalls = toolCalls,
            Steps = steps,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyApprovalRequested(RunState state, ApprovalRequestedEvent e)
    {
        var approval = new ApprovalState
        {
            Id = e.ApprovalId,
            StepId = e.StepId ?? Guid.Empty,
            ToolCallId = e.ToolCallId,
            ToolName = e.ToolName,
            OriginalArgs = e.Args,
            Status = ApprovalStatus.Pending
        };

        var toolCalls = state.ToolCalls.Select(tc =>
            tc.Id == e.ToolCallId
                ? tc with { ApprovalId = e.ApprovalId, Status = "pending_approval" }
                : tc
        ).ToList();

        return state with
        {
            Approvals = [..state.Approvals, approval],
            ToolCalls = toolCalls,
            HasPendingApproval = true,
            Status = RunStatus.WaitingApproval,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyApprovalResolved(RunState state, ApprovalResolvedEvent e)
    {
        var approvals = state.Approvals.Select(a =>
            a.Id == e.ApprovalId
                ? a with
                {
                    Status = ApprovalStatus.Resolved,
                    Decision = e.Decision,
                    EditedArgs = e.EditedArgs,
                    ResolvedBy = e.ResolvedBy,
                    ResolvedAt = e.Timestamp
                }
                : a
        ).ToList();

        var hasPendingApproval = approvals.Any(a => a.Status == ApprovalStatus.Pending);

        return state with
        {
            Approvals = approvals,
            HasPendingApproval = hasPendingApproval,
            Status = hasPendingApproval ? RunStatus.WaitingApproval : RunStatus.Running,
            UpdatedAt = e.Timestamp
        };
    }

    private static RunState ApplyArtifactCreated(RunState state, ArtifactCreatedEvent e)
    {
        var artifact = new ArtifactState
        {
            Id = e.ArtifactId,
            StepId = e.StepId,
            Kind = e.Kind,
            MimeType = e.MimeType,
            CreatedAt = e.Timestamp
        };

        return state with
        {
            Artifacts = [..state.Artifacts, artifact],
            UpdatedAt = e.Timestamp
        };
    }
}
