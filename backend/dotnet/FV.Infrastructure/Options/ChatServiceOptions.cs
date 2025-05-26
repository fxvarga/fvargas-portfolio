// Copyright (c) Microsoft. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace FV.Infrastructure.Options;

/// <summary>
/// Configuration options for the Chat Copilot service.
/// </summary>
public class ChatServiceOptions
{
    public const string PropertyName = "ChatService";
    public string? SemanticPluginsDirectory { get; set; }

    /// <summary>
    /// Local directory from which to load native plugins.
    /// </summary>
    public string? NativePluginsDirectory { get; set; }

    /// <summary>
    /// Setting indicating if the site is undergoing maintenance.
    /// </summary>
}
