using System.Text.Json;

namespace AgentChat.Shared.Dtos;

/// <summary>
/// Artifact data transfer object
/// </summary>
public record ArtifactDto
{
    public Guid Id { get; init; }
    public Guid RunId { get; init; }
    public Guid? StepId { get; init; }
    public Guid? EventId { get; init; }
    public string Kind { get; init; } = string.Empty;
    public string? MimeType { get; init; }
    public JsonElement? ContentInline { get; init; }
    public string? ContentUri { get; init; }
    public UIResourceDto? UIResource { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// MCP-UI Resource data transfer object
/// Matches the MCP-UI spec: https://github.com/MCP-UI-Org/mcp-ui
/// </summary>
public record UIResourceDto
{
    /// <summary>
    /// Unique identifier for caching and routing (e.g., "ui://ticket/12345")
    /// </summary>
    public required string Uri { get; init; }
    
    /// <summary>
    /// Content type: "text/html" | "text/uri-list" | "application/vnd.mcp-ui.remote-dom"
    /// </summary>
    public required string MimeType { get; init; }
    
    /// <summary>
    /// Inline content (for simple strings)
    /// </summary>
    public string? Text { get; init; }
    
    /// <summary>
    /// Base64-encoded content (for larger payloads)
    /// </summary>
    public string? Blob { get; init; }
}

/// <summary>
/// Attachment for user messages
/// </summary>
public record AttachmentDto
{
    public string FileName { get; init; } = string.Empty;
    public string MimeType { get; init; } = string.Empty;
    public long Size { get; init; }
    public string? Url { get; init; }
}
