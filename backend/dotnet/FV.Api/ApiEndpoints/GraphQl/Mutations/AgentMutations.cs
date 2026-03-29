using System.Security.Claims;
using FV.Application.Services.CmsAgent;
using FV.Application.Services.CmsAgent.Models;
using FV.Domain.Interfaces;
using HotChocolate.Authorization;
using HotChocolate.Subscriptions;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class AgentMutations
{
    /// <summary>
    /// Send a message to the CMS editing agent.
    /// Returns the agent's response and any proposed content changes for preview.
    /// </summary>
    [Authorize]
    [GraphQLDescription("Send a message to the CMS editing agent")]
    public async Task<AgentChatPayload> AgentChat(
        AgentChatInput input,
        [Service] ICmsAgentService agentService,
        [Service] ITenantContext tenantContext,
        [Service] ITopicEventSender eventSender,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            return new AgentChatPayload
            {
                Message = "Error: Tenant context not resolved. Please ensure you are accessing a valid portfolio.",
                SessionId = input.SessionId ?? Guid.NewGuid().ToString(),
                ProposedChanges = []
            };
        }

        var userId = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return new AgentChatPayload
            {
                Message = "Error: Unable to identify user from authentication token.",
                SessionId = input.SessionId ?? Guid.NewGuid().ToString(),
                ProposedChanges = []
            };
        }

        var portfolioId = tenantContext.PortfolioId.Value;
        var sessionId = input.SessionId ?? Guid.NewGuid().ToString();

        var request = new AgentChatRequest
        {
            Message = input.Message,
            PortfolioId = portfolioId,
            UserId = userGuid,
            ConversationHistory = input.ConversationHistory?
                .Select(h => new ChatHistoryMessage
                {
                    Role = h.Role,
                    Content = h.Content
                })
                .ToList() ?? [],
            SessionId = sessionId,
            FocusedSection = input.FocusedSection,
            CurrentRoute = input.CurrentRoute
        };

        // Stream events to subscription topic as they arrive
        var response = await agentService.ProcessMessageAsync(
            request,
            onStreamEvent: async (evt) =>
            {
                await eventSender.SendAsync(
                    $"OnAgentEvent_{evt.SessionId}",
                    evt,
                    cancellationToken);
            },
            cancellationToken: cancellationToken);

        return new AgentChatPayload
        {
            Message = response.Message,
            SessionId = response.SessionId,
            ProposedChanges = response.ProposedChanges
                .Select(c => new ProposedChangePayload
                {
                    Id = c.Id,
                    EntityType = c.EntityType,
                    RecordId = c.RecordId,
                    FieldPath = c.FieldPath,
                    OldValue = c.OldValue,
                    NewValue = c.NewValue,
                    Description = c.Description
                })
                .ToList()
        };
    }

    /// <summary>
    /// Commit proposed changes from the agent to the CMS database.
    /// Only call this after the user has previewed and approved the changes.
    /// </summary>
    [Authorize]
    [GraphQLDescription("Commit proposed changes from the agent to the CMS")]
    public async Task<CommitPayload> AgentCommit(
        AgentCommitInput input,
        [Service] ICmsAgentService agentService,
        [Service] ITenantContext tenantContext,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            return new CommitPayload
            {
                Success = false,
                Results = [],
                Error = "Tenant context not resolved"
            };
        }

        var userId = claimsPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return new CommitPayload
            {
                Success = false,
                Results = [],
                Error = "Unable to identify user from authentication token"
            };
        }

        var portfolioId = tenantContext.PortfolioId.Value;

        var commitRequest = new CommitRequest
        {
            PortfolioId = portfolioId,
            UserId = userGuid,
            Changes = input.Changes
                .Select(c => new ProposedChange
                {
                    Id = c.Id,
                    EntityType = c.EntityType,
                    RecordId = c.RecordId,
                    FieldPath = c.FieldPath,
                    OldValue = c.OldValue,
                    NewValue = c.NewValue,
                    Description = c.Description
                })
                .ToList()
        };

        var result = await agentService.CommitChangesAsync(commitRequest, cancellationToken);

        return new CommitPayload
        {
            Success = result.Success,
            Results = result.Results
                .Select(r => new ChangeResultPayload
                {
                    ChangeId = r.ChangeId,
                    Success = r.Success,
                    Error = r.Error
                })
                .ToList(),
            Error = result.Error
        };
    }
}

#region GraphQL Input Types

public class AgentChatInput
{
    [GraphQLDescription("The user's message to the agent")]
    public string Message { get; set; } = default!;

    [GraphQLDescription("Previous conversation messages for context")]
    public List<ChatHistoryMessageInput>? ConversationHistory { get; set; }

    [GraphQLDescription("Session ID for continuing a conversation. Omit to start a new session.")]
    public string? SessionId { get; set; }

    [GraphQLDescription("The CMS entity type the user has focused via the section inspector (e.g. 'hero', 'about')")]
    public string? FocusedSection { get; set; }

    [GraphQLDescription("The page route the user is currently viewing (e.g. '/', '/blog', '/projects')")]
    public string? CurrentRoute { get; set; }
}

public class ChatHistoryMessageInput
{
    [GraphQLDescription("Role of the message sender: 'user' or 'assistant'")]
    public string Role { get; set; } = default!;

    [GraphQLDescription("The message content")]
    public string Content { get; set; } = default!;
}

public class AgentCommitInput
{
    [GraphQLDescription("The proposed changes to commit")]
    public List<ProposedChangeInput> Changes { get; set; } = [];
}

public class ProposedChangeInput
{
    public string Id { get; set; } = default!;
    public string EntityType { get; set; } = default!;
    public Guid? RecordId { get; set; }
    public string FieldPath { get; set; } = default!;
    public string OldValue { get; set; } = default!;
    public string NewValue { get; set; } = default!;
    public string Description { get; set; } = default!;
}

#endregion

#region GraphQL Payload Types

public class AgentChatPayload
{
    [GraphQLDescription("The agent's response message (may include markdown)")]
    public string Message { get; set; } = default!;

    [GraphQLDescription("Session ID for continuing this conversation")]
    public string SessionId { get; set; } = default!;

    [GraphQLDescription("Proposed content changes for preview — not yet persisted")]
    public List<ProposedChangePayload> ProposedChanges { get; set; } = [];
}

public class ProposedChangePayload
{
    public string Id { get; set; } = default!;
    public string EntityType { get; set; } = default!;
    public Guid? RecordId { get; set; }
    public string FieldPath { get; set; } = default!;
    public string OldValue { get; set; } = default!;
    public string NewValue { get; set; } = default!;
    public string Description { get; set; } = default!;
}

public class CommitPayload
{
    public bool Success { get; set; }
    public List<ChangeResultPayload> Results { get; set; } = [];
    public string? Error { get; set; }
}

public class ChangeResultPayload
{
    public string ChangeId { get; set; } = default!;
    public bool Success { get; set; }
    public string? Error { get; set; }
}

#endregion
