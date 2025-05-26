// Copyright (c) Microsoft. All rights reserved.

using System.Text.Json.Serialization;

namespace FV.Infrastructure.Models;

/// <summary>
/// Parameters for creating a new chat session.
/// </summary>
public class ImportDocumentParameters
{
    [JsonPropertyName("chatId")]
    public Guid ChatId { get; set; }

    [JsonPropertyName("fileName")]
    public required string FileName { get; set; }

    [JsonPropertyName("fileLength")]
    public required long? FileLength { get; set; }

    [JsonPropertyName("contentType")]
    public string? ContentType { get; set; }

    [JsonPropertyName("content")]
    public required Stream Content { get; set; }
}
