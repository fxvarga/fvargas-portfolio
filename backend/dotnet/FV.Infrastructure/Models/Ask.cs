// Copyright (c) Microsoft. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace FV.Infrastructure.Models;

public class Ask
{
    [Required]
    public string Input { get; set; } = string.Empty;

    public IEnumerable<KeyValuePair<string, string>> Variables { get; set; } = Enumerable.Empty<KeyValuePair<string, string>>();
}
