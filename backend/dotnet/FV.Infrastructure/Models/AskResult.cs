// Copyright (c) Microsoft. All rights reserved.

namespace FV.Infrastructure.Models;
public class AskResult
{
    public string Value { get; set; } = string.Empty;

    public IEnumerable<KeyValuePair<string, object?>>? Variables { get; set; } = Enumerable.Empty<KeyValuePair<string, object?>>();
}
