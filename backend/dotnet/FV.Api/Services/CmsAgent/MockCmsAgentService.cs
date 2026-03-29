using System.Text.Json;
using FV.Application.Services;
using FV.Application.Services.CmsAgent;
using FV.Application.Services.CmsAgent.Models;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.Services.CmsAgent;

/// <summary>
/// Mock implementation of ICmsAgentService for Phase 1.
/// Returns canned responses to validate the UI/preview/commit pipeline
/// before wiring up a real LLM.
/// 
/// Lives in FV.Api (composition root) because it needs direct access to
/// CmsDbContext from FV.Infrastructure. The interface ICmsAgentService
/// stays in FV.Application following Dependency Inversion.
/// </summary>
public class MockCmsAgentService : ICmsAgentService
{
    private readonly CmsDbContext _dbContext;
    private readonly ILogger<MockCmsAgentService> _logger;

    public MockCmsAgentService(CmsDbContext dbContext, ILogger<MockCmsAgentService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<AgentResponse> ProcessMessageAsync(
        AgentChatRequest request,
        Func<AgentStreamEvent, Task>? onStreamEvent = null,
        CancellationToken cancellationToken = default)
    {
        var sessionId = request.SessionId ?? Guid.NewGuid().ToString();

        _logger.LogInformation(
            "MockCmsAgent processing message for portfolio {PortfolioId}: {Message}",
            request.PortfolioId, request.Message);

        // Stream a "thinking" token if callback is provided
        if (onStreamEvent != null)
        {
            await onStreamEvent(new AgentStreamEvent
            {
                SessionId = sessionId,
                EventType = "token",
                Token = "Analyzing your request"
            });
            await Task.Delay(200, cancellationToken);
            await onStreamEvent(new AgentStreamEvent
            {
                SessionId = sessionId,
                EventType = "token",
                Token = "..."
            });
            await Task.Delay(300, cancellationToken);
        }

        var message = request.Message.ToLowerInvariant();
        var proposedChanges = new List<ProposedChange>();
        string responseMessage;

        try
        {
            // Route based on simple keyword matching (mock routing)
            if (message.Contains("hero") && ContainsEditIntent(message))
            {
                (responseMessage, proposedChanges) = await HandleHeroEdit(request, cancellationToken);
            }
            else if (message.Contains("about") && ContainsEditIntent(message))
            {
                (responseMessage, proposedChanges) = await HandleAboutEdit(request, cancellationToken);
            }
            else if (message.Contains("list") && (message.Contains("content") || message.Contains("types") || message.Contains("sections")))
            {
                responseMessage = await HandleListContentTypes(request.PortfolioId, cancellationToken);
            }
            else if (message.Contains("show") || message.Contains("what") || message.Contains("current") || message.Contains("get"))
            {
                responseMessage = await HandleGetContent(request, cancellationToken);
            }
            else
            {
                responseMessage = "I can help you edit your portfolio content. Try asking me to:\n\n" +
                    "- **Edit** a section (e.g., \"Change the hero title to 'Welcome'\")\n" +
                    "- **Show** current content (e.g., \"Show me the hero section\")\n" +
                    "- **List** available content types\n\n" +
                    "What would you like to do?";
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing agent message");
            responseMessage = $"Sorry, I encountered an error: {ex.Message}";
        }

        // Stream proposed changes if callback is provided
        if (onStreamEvent != null)
        {
            foreach (var change in proposedChanges)
            {
                await onStreamEvent(new AgentStreamEvent
                {
                    SessionId = sessionId,
                    EventType = "proposed_change",
                    Change = change
                });
            }

            await onStreamEvent(new AgentStreamEvent
            {
                SessionId = sessionId,
                EventType = "complete",
                FullMessage = responseMessage
            });
        }

        return new AgentResponse
        {
            Message = responseMessage,
            ProposedChanges = proposedChanges,
            SessionId = sessionId
        };
    }

    public async Task<CommitResult> CommitChangesAsync(
        CommitRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Committing {Count} changes for portfolio {PortfolioId}",
            request.Changes.Count, request.PortfolioId);

        var results = new List<ChangeResult>();

        foreach (var change in request.Changes)
        {
            try
            {
                var result = await ApplyChange(request.PortfolioId, change, cancellationToken);
                results.Add(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to commit change {ChangeId}", change.Id);
                results.Add(new ChangeResult
                {
                    ChangeId = change.Id,
                    Success = false,
                    Error = ex.Message
                });
            }
        }

        return new CommitResult
        {
            Success = results.All(r => r.Success),
            Results = results
        };
    }

    #region Mock message handlers

    private async Task<(string message, List<ProposedChange> changes)> HandleHeroEdit(
        AgentChatRequest request,
        CancellationToken cancellationToken)
    {
        var record = await GetRecord(request.PortfolioId, "hero", cancellationToken);
        if (record == null)
        {
            return ("I couldn't find a hero section for your portfolio. Would you like me to create one?", []);
        }

        var data = JsonSerializer.Deserialize<JsonElement>(record.JsonData);
        var currentTitle = data.TryGetProperty("title", out var titleProp)
            ? titleProp.GetString() ?? ""
            : "";

        // Extract a new title from the message if possible
        var newTitle = ExtractQuotedText(request.Message) ?? "Building the Future";

        var changes = new List<ProposedChange>
        {
            new()
            {
                Id = Guid.NewGuid().ToString(),
                EntityType = "hero",
                RecordId = record.Id,
                FieldPath = "title",
                OldValue = JsonSerializer.Serialize(currentTitle),
                NewValue = JsonSerializer.Serialize(newTitle),
                Description = $"Change hero title from \"{currentTitle}\" to \"{newTitle}\""
            }
        };

        var message = $"I'll update the hero title. Here's what I'm proposing:\n\n" +
            $"**Title**: \"{currentTitle}\" \u2192 \"{newTitle}\"\n\n" +
            "You can preview this change on the page. Click **Commit** to save or **Discard** to cancel.";

        return (message, changes);
    }

    private async Task<(string message, List<ProposedChange> changes)> HandleAboutEdit(
        AgentChatRequest request,
        CancellationToken cancellationToken)
    {
        var record = await GetRecord(request.PortfolioId, "about", cancellationToken);
        if (record == null)
        {
            return ("I couldn't find an about section for your portfolio.", []);
        }

        var data = JsonSerializer.Deserialize<JsonElement>(record.JsonData);
        var currentDescription = data.TryGetProperty("description", out var descProp)
            ? descProp.GetString() ?? ""
            : "";

        var newDescription = ExtractQuotedText(request.Message)
            ?? "A passionate developer building innovative solutions.";

        var changes = new List<ProposedChange>
        {
            new()
            {
                Id = Guid.NewGuid().ToString(),
                EntityType = "about",
                RecordId = record.Id,
                FieldPath = "description",
                OldValue = JsonSerializer.Serialize(currentDescription),
                NewValue = JsonSerializer.Serialize(newDescription),
                Description = "Update about section description"
            }
        };

        var message = $"I'll update the about section description.\n\n" +
            $"**Current**: \"{Truncate(currentDescription, 100)}\"\n" +
            $"**Proposed**: \"{Truncate(newDescription, 100)}\"\n\n" +
            "Preview the change and click **Commit** when ready.";

        return (message, changes);
    }

    private async Task<string> HandleListContentTypes(Guid portfolioId, CancellationToken cancellationToken)
    {
        var definitions = await _dbContext.EntityDefinitions
            .Where(d => d.PortfolioId == portfolioId)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);

        if (!definitions.Any())
        {
            return "No content types found for this portfolio.";
        }

        var lines = definitions.Select(d =>
            $"- **{d.DisplayName ?? d.Name}** (`{d.Name}`) \u2014 {(d.IsSingleton ? "Singleton" : "Collection")}" +
            (d.Description != null ? $" \u2014 {d.Description}" : ""));

        return "Here are your available content types:\n\n" + string.Join("\n", lines);
    }

    private async Task<string> HandleGetContent(AgentChatRequest request, CancellationToken cancellationToken)
    {
        // Try to find which entity type the user is asking about
        var entityTypes = new[] { "hero", "about", "services", "contact", "navigation", "footer", "site-config" };
        var requestedType = entityTypes.FirstOrDefault(t => request.Message.ToLowerInvariant().Contains(t));

        if (requestedType == null)
        {
            return "Which section would you like to see? Available sections: " +
                string.Join(", ", entityTypes.Select(t => $"`{t}`"));
        }

        var record = await GetRecord(request.PortfolioId, requestedType, cancellationToken);
        if (record == null)
        {
            return $"No `{requestedType}` content found for your portfolio.";
        }

        var data = JsonSerializer.Deserialize<JsonElement>(record.JsonData);
        var formatted = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });

        // Truncate if too long
        if (formatted.Length > 1500)
        {
            formatted = formatted[..1500] + "\n... (truncated)";
        }

        return $"Here's the current `{requestedType}` content:\n\n```json\n{formatted}\n```";
    }

    #endregion

    #region Commit logic (real — applies changes to the database)

    private async Task<ChangeResult> ApplyChange(
        Guid portfolioId,
        ProposedChange change,
        CancellationToken cancellationToken)
    {
        // Find the record
        EntityRecord? record;
        if (change.RecordId.HasValue)
        {
            record = await _dbContext.EntityRecords
                .FirstOrDefaultAsync(r => r.Id == change.RecordId.Value && r.PortfolioId == portfolioId, cancellationToken);
        }
        else
        {
            record = await GetRecord(portfolioId, change.EntityType, cancellationToken);
        }

        if (record == null)
        {
            return new ChangeResult
            {
                ChangeId = change.Id,
                Success = false,
                Error = $"Record not found for entity type '{change.EntityType}'"
            };
        }

        // Save version history before updating
        var versionRecord = new EntityRecordVersion
        {
            Id = Guid.NewGuid(),
            EntityRecordId = record.Id,
            EntityType = record.EntityType,
            JsonData = record.JsonData,
            Version = record.Version,
            CreatedAt = DateTime.UtcNow,
            PortfolioId = portfolioId
        };
        _dbContext.EntityRecordVersions.Add(versionRecord);

        // Apply the field change to the JSON data
        var jsonData = JsonSerializer.Deserialize<JsonElement>(record.JsonData);
        var updatedJson = ApplyFieldChange(jsonData, change.FieldPath, change.NewValue);

        // Validate against schema
        var definition = await _dbContext.EntityDefinitions
            .FirstOrDefaultAsync(d => d.Name == change.EntityType && d.PortfolioId == portfolioId, cancellationToken);

        if (definition != null)
        {
            var validationService = new SchemaValidationService();
            var validationResult = validationService.Validate(definition, updatedJson);
            if (!validationResult.IsValid)
            {
                var errors = string.Join("; ", validationResult.Errors.Select(e => $"{e.Field}: {e.Message}"));
                return new ChangeResult
                {
                    ChangeId = change.Id,
                    Success = false,
                    Error = $"Validation failed: {errors}"
                };
            }
        }

        // Update the record
        record.JsonData = updatedJson.GetRawText();
        record.UpdatedAt = DateTime.UtcNow;
        record.Version++;

        // Publish (make non-draft) if it was a draft
        if (record.IsDraft)
        {
            record.IsDraft = false;
            record.PublishedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Committed change {ChangeId}: {EntityType}.{FieldPath} for record {RecordId}",
            change.Id, change.EntityType, change.FieldPath, record.Id);

        return new ChangeResult
        {
            ChangeId = change.Id,
            Success = true
        };
    }

    /// <summary>
    /// Applies a field change to a JSON element. Supports top-level fields
    /// and simple dot-notation paths (e.g., "title", "items[0].name").
    /// </summary>
    private static JsonElement ApplyFieldChange(JsonElement root, string fieldPath, string newValueJson)
    {
        var newValue = JsonSerializer.Deserialize<JsonElement>(newValueJson);

        if (fieldPath == "*")
        {
            // Full record replacement
            return newValue;
        }

        // Parse the root into a mutable dictionary
        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(root.GetRawText())
            ?? new Dictionary<string, JsonElement>();

        // For simple top-level fields, just replace
        if (!fieldPath.Contains('.') && !fieldPath.Contains('['))
        {
            dict[fieldPath] = newValue;
        }
        else
        {
            // For nested paths, serialize back, do string manipulation
            // This is a simple approach — Phase 2 will use proper JSON Pointer
            var parts = fieldPath.Split('.');
            if (parts.Length == 1)
            {
                dict[parts[0]] = newValue;
            }
            else
            {
                // For now, handle one level of nesting
                SetNestedValue(dict, parts, newValue);
            }
        }

        return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(dict));
    }

    private static void SetNestedValue(Dictionary<string, JsonElement> dict, string[] parts, JsonElement value)
    {
        if (parts.Length == 0) return;

        var key = parts[0];

        // Handle array index syntax like "items[0]"
        var arrayMatch = System.Text.RegularExpressions.Regex.Match(key, @"^(\w+)\[(\d+)\]$");

        if (parts.Length == 1)
        {
            if (arrayMatch.Success)
            {
                var arrayKey = arrayMatch.Groups[1].Value;
                var index = int.Parse(arrayMatch.Groups[2].Value);

                if (dict.TryGetValue(arrayKey, out var arrayElement) &&
                    arrayElement.ValueKind == JsonValueKind.Array)
                {
                    var list = JsonSerializer.Deserialize<List<JsonElement>>(arrayElement.GetRawText()) ?? [];
                    if (index >= 0 && index < list.Count)
                    {
                        list[index] = value;
                        dict[arrayKey] = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(list));
                    }
                }
            }
            else
            {
                dict[key] = value;
            }
        }
        else
        {
            // Recurse into nested object
            if (arrayMatch.Success)
            {
                var arrayKey = arrayMatch.Groups[1].Value;
                var index = int.Parse(arrayMatch.Groups[2].Value);

                if (dict.TryGetValue(arrayKey, out var arrayElement) &&
                    arrayElement.ValueKind == JsonValueKind.Array)
                {
                    var list = JsonSerializer.Deserialize<List<JsonElement>>(arrayElement.GetRawText()) ?? [];
                    if (index >= 0 && index < list.Count)
                    {
                        var itemDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                            list[index].GetRawText()) ?? [];
                        SetNestedValue(itemDict, parts[1..], value);
                        list[index] = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(itemDict));
                        dict[arrayKey] = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(list));
                    }
                }
            }
            else if (dict.TryGetValue(key, out var nested) && nested.ValueKind == JsonValueKind.Object)
            {
                var nestedDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
                    nested.GetRawText()) ?? [];
                SetNestedValue(nestedDict, parts[1..], value);
                dict[key] = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(nestedDict));
            }
        }
    }

    #endregion

    #region Helpers

    private async Task<EntityRecord?> GetRecord(Guid portfolioId, string entityType, CancellationToken cancellationToken)
    {
        return await _dbContext.EntityRecords
            .Where(r => r.PortfolioId == portfolioId
                     && r.EntityType == entityType
                     && !r.IsDraft)
            .OrderByDescending(r => r.UpdatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static bool ContainsEditIntent(string message)
    {
        var editWords = new[] { "change", "update", "edit", "set", "modify", "replace", "make" };
        return editWords.Any(w => message.Contains(w));
    }

    private static string? ExtractQuotedText(string message)
    {
        // Try double quotes first
        var match = System.Text.RegularExpressions.Regex.Match(message, "\"([^\"]+)\"");
        if (match.Success) return match.Groups[1].Value;

        // Try single quotes
        match = System.Text.RegularExpressions.Regex.Match(message, "'([^']+)'");
        if (match.Success) return match.Groups[1].Value;

        // Try "to X" pattern
        match = System.Text.RegularExpressions.Regex.Match(message, @"\bto\s+(.+?)(?:\.|$)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var extracted = match.Groups[1].Value.Trim();
            // Don't return if it's too short or looks like a content type
            if (extracted.Length > 3 && !extracted.Contains("hero") && !extracted.Contains("about"))
                return extracted;
        }

        return null;
    }

    private static string Truncate(string text, int maxLength)
    {
        return text.Length <= maxLength ? text : text[..maxLength] + "...";
    }

    #endregion
}
