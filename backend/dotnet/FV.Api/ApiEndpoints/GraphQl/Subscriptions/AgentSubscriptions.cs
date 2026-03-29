using FV.Api.ApiEndpoints.GraphQl.Mutations;
using FV.Application.Services.CmsAgent.Models;
using HotChocolate.Subscriptions;

namespace FV.Api.ApiEndpoints.GraphQl.Subscriptions;

/// <summary>
/// GraphQL subscriptions for streaming agent events (tokens, proposed changes, completion)
/// to the frontend in real-time. Uses HotChocolate's in-memory pub/sub.
/// 
/// The topic is dynamic per session: "OnAgentEvent_{sessionId}".
/// The mutation (AgentMutations.AgentChat) publishes events to this topic
/// as the agent service streams them via the onStreamEvent callback.
/// </summary>
[ExtendObjectType(typeof(SessionSubscriptions))]
public class AgentSubscriptions
{
    /// <summary>
    /// Subscribe to real-time agent events for a specific chat session.
    /// Events include streaming tokens, proposed changes, completion, and errors.
    /// </summary>
    [Subscribe]
    [Topic("OnAgentEvent_{sessionId}")]
    [GraphQLDescription("Stream agent response events in real-time for a chat session")]
    public AgentStreamEventPayload OnAgentEvent(
        string sessionId,
        [EventMessage] AgentStreamEvent evt)
    {
        return new AgentStreamEventPayload
        {
            SessionId = evt.SessionId,
            EventType = evt.EventType,
            Token = evt.Token,
            Change = evt.Change != null
                ? new ProposedChangePayload
                {
                    Id = evt.Change.Id,
                    EntityType = evt.Change.EntityType,
                    RecordId = evt.Change.RecordId,
                    FieldPath = evt.Change.FieldPath,
                    OldValue = evt.Change.OldValue,
                    NewValue = evt.Change.NewValue,
                    Description = evt.Change.Description
                }
                : null,
            FullMessage = evt.FullMessage,
            Error = evt.Error
        };
    }
}

#region Subscription Payload Types

/// <summary>
/// Payload for agent stream events sent via GraphQL subscription.
/// </summary>
public class AgentStreamEventPayload
{
    [GraphQLDescription("The session ID this event belongs to")]
    public string SessionId { get; set; } = default!;

    [GraphQLDescription("Event type: 'token', 'proposed_change', 'complete', or 'error'")]
    public string EventType { get; set; } = default!;

    [GraphQLDescription("A text token delta (for streaming LLM output). Present when eventType is 'token'.")]
    public string? Token { get; set; }

    [GraphQLDescription("A proposed change. Present when eventType is 'proposed_change'.")]
    public ProposedChangePayload? Change { get; set; }

    [GraphQLDescription("The full message text. Present when eventType is 'complete'.")]
    public string? FullMessage { get; set; }

    [GraphQLDescription("Error message. Present when eventType is 'error'.")]
    public string? Error { get; set; }
}

#endregion
