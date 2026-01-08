using AgentChat.Shared.Dtos;

namespace AgentChat.Shared.Events;

/// <summary>
/// Emitted when a user sends a message
/// </summary>
public record MessageUserCreatedEvent : RunEventBase
{
    public override string EventType => "message.user.created";
    
    public required Guid MessageId { get; init; }
    public required string Content { get; init; }
    public List<AttachmentDto>? Attachments { get; init; }
}

/// <summary>
/// Emitted when an assistant message is created (after streaming completes)
/// </summary>
public record MessageAssistantCreatedEvent : RunEventBase
{
    public override string EventType => "message.assistant.created";
    
    public required Guid MessageId { get; init; }
    public required string Content { get; init; }
    public List<CitationDto>? Citations { get; init; }
    public int TokenCount { get; init; }
}
