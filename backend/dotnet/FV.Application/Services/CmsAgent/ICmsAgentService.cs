using FV.Application.Services.CmsAgent.Models;

namespace FV.Application.Services.CmsAgent;

/// <summary>
/// Service for the CMS editing agent. Processes natural language messages
/// and returns proposed content changes for preview and commit.
/// </summary>
public interface ICmsAgentService
{
    /// <summary>
    /// Process a user message and return an agent response with proposed changes.
    /// </summary>
    /// <param name="request">The chat request with message, context, and history.</param>
    /// <param name="onStreamEvent">Optional callback for streaming events to the client.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The agent response with message text and any proposed changes.</returns>
    Task<AgentResponse> ProcessMessageAsync(
        AgentChatRequest request,
        Func<AgentStreamEvent, Task>? onStreamEvent = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Commit approved proposed changes to the CMS backend.
    /// </summary>
    /// <param name="request">The commit request with changes to apply.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result indicating success/failure per change.</returns>
    Task<CommitResult> CommitChangesAsync(
        CommitRequest request,
        CancellationToken cancellationToken = default);
}
