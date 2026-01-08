using AgentChat.Shared.Dtos;

namespace AgentChat.Shared.Events;

/// <summary>
/// Emitted when an artifact is created (e.g., MCP-UI resource)
/// </summary>
public record ArtifactCreatedEvent : RunEventBase
{
    public override string EventType => "artifact.created";
    
    public required Guid ArtifactId { get; init; }
    public required string Kind { get; init; }
    public string? MimeType { get; init; }
    
    /// <summary>
    /// For MCP-UI artifacts
    /// </summary>
    public UIResourceDto? UIResource { get; init; }
    
    /// <summary>
    /// For large content stored externally
    /// </summary>
    public string? ContentUri { get; init; }
}
