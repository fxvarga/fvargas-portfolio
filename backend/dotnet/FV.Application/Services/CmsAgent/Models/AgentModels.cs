using System.Text.Json;

namespace FV.Application.Services.CmsAgent.Models;

/// <summary>
/// Request to send a message to the CMS editing agent.
/// </summary>
public record AgentChatRequest
{
    public required string Message { get; init; }
    public required Guid PortfolioId { get; init; }
    public required Guid UserId { get; init; }
    public List<ChatHistoryMessage> ConversationHistory { get; init; } = [];
    public string? SessionId { get; init; }

    /// <summary>
    /// The CMS entity type the user has focused/selected via the section inspector
    /// (e.g. "hero", "about", "services"). Null when no section is selected.
    /// </summary>
    public string? FocusedSection { get; init; }

    /// <summary>
    /// The page route the user is currently viewing (e.g. "/", "/blog", "/projects").
    /// Null when not provided by the frontend.
    /// </summary>
    public string? CurrentRoute { get; init; }
}

/// <summary>
/// A single message in the conversation history.
/// </summary>
public record ChatHistoryMessage
{
    public required string Role { get; init; } // "user" or "assistant"
    public required string Content { get; init; }
}

/// <summary>
/// Response from the CMS editing agent.
/// </summary>
public record AgentResponse
{
    public required string Message { get; init; }
    public List<ProposedChange> ProposedChanges { get; init; } = [];
    public required string SessionId { get; init; }
}

/// <summary>
/// A proposed content change that has NOT been persisted.
/// Shown to the user for preview and approval.
/// </summary>
public record ProposedChange
{
    /// <summary>Unique identifier for this proposed change.</summary>
    public required string Id { get; init; }

    /// <summary>The entity type being modified (e.g., "hero", "about", "services").</summary>
    public required string EntityType { get; init; }

    /// <summary>The ID of the specific EntityRecord being modified. Null for new records.</summary>
    public Guid? RecordId { get; init; }

    /// <summary>
    /// Dot-notation path to the field being changed (e.g., "title", "items[0].name").
    /// For full-record replacement, use "*".
    /// </summary>
    public required string FieldPath { get; init; }

    /// <summary>The current value (JSON-serialized).</summary>
    public required string OldValue { get; init; }

    /// <summary>The proposed new value (JSON-serialized).</summary>
    public required string NewValue { get; init; }

    /// <summary>Human-readable description of what this change does.</summary>
    public required string Description { get; init; }
}

/// <summary>
/// Request to commit proposed changes to the CMS.
/// </summary>
public record CommitRequest
{
    public required Guid PortfolioId { get; init; }
    public required Guid UserId { get; init; }
    public required List<ProposedChange> Changes { get; init; }
}

/// <summary>
/// Result of committing proposed changes.
/// </summary>
public record CommitResult
{
    public bool Success { get; init; }
    public List<ChangeResult> Results { get; init; } = [];
    public string? Error { get; init; }
}

/// <summary>
/// Result for a single change within a commit.
/// </summary>
public record ChangeResult
{
    public required string ChangeId { get; init; }
    public bool Success { get; init; }
    public string? Error { get; init; }
}

/// <summary>
/// A streaming event from the agent to the frontend.
/// </summary>
public record AgentStreamEvent
{
    public required string SessionId { get; init; }

    /// <summary>Event type: "token", "proposed_change", "complete", "error".</summary>
    public required string EventType { get; init; }

    /// <summary>A text token delta (for streaming LLM output).</summary>
    public string? Token { get; init; }

    /// <summary>A proposed change (sent when the agent produces one).</summary>
    public ProposedChange? Change { get; init; }

    /// <summary>The full message text (sent with "complete" event).</summary>
    public string? FullMessage { get; init; }

    /// <summary>Error message (sent with "error" event).</summary>
    public string? Error { get; init; }
}
