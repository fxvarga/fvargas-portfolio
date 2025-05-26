// Copyright (c) Microsoft. All rights reserved.

using System.Text.Json.Serialization;

namespace FV.Infrastructure.Models;

/// <summary>
/// Parameters for creating a new chat session.
/// </summary>
public class CreateChatParameters
{
    /// <summary>
    /// Title of the chat.
    /// </summary>
    [JsonPropertyName("title")]
    public string? Title { get; set; }
}
