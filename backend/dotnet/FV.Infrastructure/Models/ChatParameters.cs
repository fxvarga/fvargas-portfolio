// Copyright (c) Microsoft. All rights reserved.

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using FV.Infrastructure.Options;

namespace FV.Infrastructure.Models;

/// <summary>
/// Parameters for creating a new chat session.
/// </summary>
public class ChatParameters
{
    public Guid ChatId { get; set; }

    [Required, NotEmptyOrWhitespace]
    public string Input { get; set; } = string.Empty;


}
