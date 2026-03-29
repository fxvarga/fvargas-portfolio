using System.Text;
using System.Text.Json;
using FV.Application.Services;
using FV.Application.Services.CmsAgent;
using FV.Application.Services.CmsAgent.Models;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace FV.Api.Services.CmsAgent;

/// <summary>
/// Real LLM-powered CMS editing agent using Semantic Kernel.
/// Uses Azure OpenAI chat completion with auto function calling
/// to let the LLM invoke CmsAgentTools for content operations.
/// 
/// Commit logic is shared with MockCmsAgentService (same ApplyFieldChange
/// and schema validation approach).
/// </summary>
public class CmsAgentService : ICmsAgentService
{
    private readonly Kernel _kernel;
    private readonly CmsDbContext _dbContext;
    private readonly ILogger<CmsAgentService> _logger;

    public CmsAgentService(
        Kernel kernel,
        CmsDbContext dbContext,
        ILogger<CmsAgentService> logger)
    {
        _kernel = kernel;
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
            "CmsAgent processing message for portfolio {PortfolioId}: {Message}",
            request.PortfolioId, request.Message);

        try
        {
            // Create a per-request tools plugin scoped to this portfolio
            var tools = new CmsAgentTools(_dbContext, request.PortfolioId);

            // Clone the kernel and add the tools plugin for this request
            var requestKernel = _kernel.Clone();
            requestKernel.Plugins.AddFromObject(tools, "CmsTools");

            // Build the system prompt with dynamic schema context
            var systemPrompt = await BuildSystemPrompt(
                request.PortfolioId,
                request.FocusedSection,
                request.CurrentRoute,
                cancellationToken);

            // Build chat history from conversation context
            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage(systemPrompt);

            foreach (var historyMessage in request.ConversationHistory)
            {
                if (historyMessage.Role == "user")
                    chatHistory.AddUserMessage(historyMessage.Content);
                else if (historyMessage.Role == "assistant")
                    chatHistory.AddAssistantMessage(historyMessage.Content);
            }

            chatHistory.AddUserMessage(request.Message);

            // Configure execution settings with auto function calling
            var executionSettings = new OpenAIPromptExecutionSettings
            {
                FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
            };

            // Stream the response
            var fullMessage = new StringBuilder();
            var chatCompletionService = requestKernel.GetRequiredService<IChatCompletionService>();

            await foreach (var update in chatCompletionService.GetStreamingChatMessageContentsAsync(
                chatHistory,
                executionSettings,
                requestKernel,
                cancellationToken))
            {
                if (!string.IsNullOrEmpty(update.Content))
                {
                    fullMessage.Append(update.Content);

                    if (onStreamEvent != null)
                    {
                        await onStreamEvent(new AgentStreamEvent
                        {
                            SessionId = sessionId,
                            EventType = "token",
                            Token = update.Content
                        });
                    }
                }
            }

            // Collect any proposed changes from the tools plugin
            var proposedChanges = tools.GetProposedChanges()
                .Select(c => new ProposedChange
                {
                    Id = c.Id,
                    EntityType = c.EntityType,
                    RecordId = c.RecordId,
                    FieldPath = c.FieldPath,
                    OldValue = c.OldValue,
                    NewValue = c.NewValue,
                    Description = c.Description
                })
                .ToList();

            // Stream proposed changes to the client
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
                    FullMessage = fullMessage.ToString()
                });
            }

            return new AgentResponse
            {
                Message = fullMessage.ToString(),
                ProposedChanges = proposedChanges,
                SessionId = sessionId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CmsAgentService.ProcessMessageAsync");

            var errorMessage = $"Sorry, I encountered an error processing your request: {ex.Message}";

            if (onStreamEvent != null)
            {
                await onStreamEvent(new AgentStreamEvent
                {
                    SessionId = sessionId,
                    EventType = "error",
                    Error = errorMessage
                });
            }

            return new AgentResponse
            {
                Message = errorMessage,
                ProposedChanges = [],
                SessionId = sessionId
            };
        }
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

    #region System Prompt

    private async Task<string> BuildSystemPrompt(
        Guid portfolioId,
        string? focusedSection,
        string? currentRoute,
        CancellationToken cancellationToken)
    {
        // Fetch all entity definitions for this portfolio to inject schema context
        var definitions = await _dbContext.EntityDefinitions
            .Where(d => d.PortfolioId == portfolioId)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);

        var schemaContext = BuildSchemaContext(definitions);

        // Build dynamic user-context block
        var userContextParts = new List<string>();
        if (!string.IsNullOrWhiteSpace(focusedSection))
        {
            var sectionDef = definitions.FirstOrDefault(d =>
                string.Equals(d.Name, focusedSection, StringComparison.OrdinalIgnoreCase));
            var sectionLabel = sectionDef?.DisplayName ?? focusedSection;
            userContextParts.Add($"- **Focused section**: `{focusedSection}` ({sectionLabel}). The user has selected this section using the inspector. Prioritize operations on this content type unless the user explicitly asks about a different section.");
        }
        if (!string.IsNullOrWhiteSpace(currentRoute))
        {
            userContextParts.Add($"- **Current page**: `{currentRoute}`. The user is viewing this page. If the request is ambiguous about which content to edit, consider what content appears on this page.");

            // Add specific route-resolution instructions based on the route pattern
            var routeSegments = currentRoute.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (routeSegments.Length >= 2)
            {
                userContextParts.Add($"- **IMPORTANT**: The current route `{currentRoute}` looks like a collection item page (e.g., a blog post or work item). Before doing ANYTHING else, call `get_content_by_route` with route `{currentRoute}` to resolve the specific content record. Use the `RecordId` from the result when calling `propose_content_update`. Do NOT rely on `get_page_content` without a `recordId` for collection items — it will return the wrong record.");
            }
        }

        var userContext = userContextParts.Count > 0
            ? $"""

            ## Current User Context
            {string.Join("\n", userContextParts)}
            """
            : "";

        return $"""
            You are a CMS content editing assistant. You help portfolio owners edit their website content through natural language conversation.

            ## Your Role
            - You help users view and modify their portfolio website content
            - You propose changes that the user can preview on their live site before committing
            - You NEVER make changes directly — you always propose them for user approval
            - You are precise, helpful, and concise

            ## How You Work
            1. **Route resolution first**: If `currentRoute` is provided and looks like a collection item page (e.g., `/blog/some-slug`, `/work/some-project`), your FIRST action must be to call `get_content_by_route` with that route. This gives you the correct `RecordId` for the page the user is viewing.
            2. When a user asks to see content, use `get_page_content` to fetch current values. For collection items, always pass the `recordId`.
            3. When a user asks to change content, ALWAYS:
               a. First resolve the route (if applicable) to get the `RecordId`
               b. Use `get_page_content` with the `recordId` to see the current value
               c. Then use `get_entity_schema` to understand the field types and constraints
               d. Then use `propose_content_update` with the `recordId` to propose the change
            4. When proposing changes, explain what you're changing clearly
            5. The user will see a live preview and can approve (commit) or discard

            ## Route-to-Content Mapping
            Portfolio sites use these URL patterns:
            - `/blog/SLUG` → entity type `blog-post`, matched by `slug` field in JSON data
            - `/work/SLUG` → entity type `services`, matched by `slug` field
            - `/` → home page with singleton sections (hero, about, services, contact, etc.)
            - For collection items, you MUST use `recordId` in `propose_content_update` — without it, the wrong record may be targeted

            ## Important Rules
            - ALWAYS look up current content before proposing changes
            - ALWAYS check the schema to ensure your proposed values match the expected types
            - String values in `propose_content_update` must be JSON-encoded (e.g., `"Hello World"` with quotes)
            - Number values should be bare numbers (e.g., `42`)
            - Boolean values should be bare (e.g., `true` or `false`)
            - For array items, use bracket notation in field paths (e.g., `items[0].name`)
            - You can propose multiple changes in a single response
            - Keep your responses concise — the user wants to edit content efficiently
            - If you don't know which section the user is referring to, use `list_content_types` to show available options
            - If the user's request is ambiguous, ask for clarification
            - When a focused section is provided, scope your operations to that section unless the user explicitly references a different one
            {userContext}

            ## Available Content Types and Schema
            {schemaContext}

            ## Response Style
            - Use markdown formatting for readability
            - When proposing changes, summarize what will change using **bold** for field names
            - After proposing, remind the user they can preview and commit/discard
            - Be conversational but efficient — avoid unnecessary verbosity
            """;
    }

    private static string BuildSchemaContext(List<EntityDefinition> definitions)
    {
        if (definitions.Count == 0)
            return "No content types are configured for this portfolio.";

        var sb = new StringBuilder();
        sb.AppendLine("The following content types are available:\n");

        foreach (var def in definitions)
        {
            sb.AppendLine($"### {def.DisplayName ?? def.Name} (`{def.Name}`)");
            if (!string.IsNullOrEmpty(def.Description))
                sb.AppendLine($"  {def.Description}");
            sb.AppendLine($"  Type: {(def.IsSingleton ? "Singleton" : "Collection")}");

            if (def.Attributes.Count > 0)
            {
                sb.AppendLine("  Fields:");
                FormatAttributeTree(sb, def.Attributes, "    ");
            }
            sb.AppendLine();
        }

        return sb.ToString();
    }

    private static void FormatAttributeTree(StringBuilder sb, List<AttributeDefinition> attributes, string indent)
    {
        foreach (var attr in attributes.OrderBy(a => a.Order))
        {
            var required = attr.IsRequired ? " (required)" : "";
            var label = !string.IsNullOrEmpty(attr.Label) ? $" — {attr.Label}" : "";
            sb.AppendLine($"{indent}- `{attr.Name}` ({attr.Type}){required}{label}");

            if (attr.Options != null && attr.Options.Count > 0)
            {
                var options = string.Join(", ", attr.Options.Select(o => $"`{o.Value}`"));
                sb.AppendLine($"{indent}  Options: {options}");
            }

            if (attr.Children != null && attr.Children.Count > 0)
            {
                sb.AppendLine($"{indent}  Children:");
                FormatAttributeTree(sb, attr.Children, indent + "    ");
            }
        }
    }

    #endregion

    #region Commit Logic (shared with MockCmsAgentService)

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
            record = await _dbContext.EntityRecords
                .Where(r => r.PortfolioId == portfolioId
                         && r.EntityType == change.EntityType
                         && !r.IsDraft)
                .OrderByDescending(r => r.UpdatedAt)
                .FirstOrDefaultAsync(cancellationToken);
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

        // Publish if it was a draft
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
    /// and dot-notation paths with array index syntax (e.g., "items[0].name").
    /// </summary>
    private static JsonElement ApplyFieldChange(JsonElement root, string fieldPath, string newValueJson)
    {
        var newValue = JsonSerializer.Deserialize<JsonElement>(newValueJson);

        if (fieldPath == "*")
            return newValue;

        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(root.GetRawText())
            ?? new Dictionary<string, JsonElement>();

        if (!fieldPath.Contains('.') && !fieldPath.Contains('['))
        {
            dict[fieldPath] = newValue;
        }
        else
        {
            var parts = fieldPath.Split('.');
            if (parts.Length == 1)
                dict[parts[0]] = newValue;
            else
                SetNestedValue(dict, parts, newValue);
        }

        return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(dict));
    }

    private static void SetNestedValue(Dictionary<string, JsonElement> dict, string[] parts, JsonElement value)
    {
        if (parts.Length == 0) return;

        var key = parts[0];
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
}
