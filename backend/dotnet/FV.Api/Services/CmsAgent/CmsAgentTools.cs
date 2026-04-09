using System.ComponentModel;
using System.Text.Json;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;

namespace FV.Api.Services.CmsAgent;

/// <summary>
/// Semantic Kernel plugin that provides CMS content tools to the LLM agent.
/// Each method is a tool the agent can call via function calling.
/// 
/// This plugin is instantiated per-request with a scoped CmsDbContext and
/// the current portfolio's ID. ProposedChanges are accumulated during the
/// conversation and returned to the caller.
/// </summary>
public class CmsAgentTools
{
    private readonly CmsDbContext _dbContext;
    private readonly Guid _portfolioId;
    private readonly List<ProposedChangeResult> _proposedChanges = [];

    public CmsAgentTools(CmsDbContext dbContext, Guid portfolioId)
    {
        _dbContext = dbContext;
        _portfolioId = portfolioId;
    }

    /// <summary>
    /// Get the proposed changes accumulated during this conversation turn.
    /// </summary>
    public IReadOnlyList<ProposedChangeResult> GetProposedChanges() => _proposedChanges.AsReadOnly();

    [KernelFunction("list_content_types")]
    [Description("List all available content types (entity definitions) for this portfolio. Returns names, display names, descriptions, and whether they are singletons or collections.")]
    public async Task<string> ListContentTypes()
    {
        var definitions = await _dbContext.EntityDefinitions
            .Where(d => d.PortfolioId == _portfolioId)
            .OrderBy(d => d.Name)
            .Select(d => new
            {
                d.Name,
                d.DisplayName,
                d.Description,
                d.IsSingleton,
                d.Category,
                AttributeCount = d.Attributes.Count
            })
            .ToListAsync();

        if (definitions.Count == 0)
            return "No content types found for this portfolio.";

        return JsonSerializer.Serialize(definitions, new JsonSerializerOptions { WriteIndented = true });
    }

    [KernelFunction("get_entity_schema")]
    [Description("Get the schema (attribute definitions) for a specific content type. Returns field names, types, whether they are required, labels, and help text. Use this to understand what fields are available before proposing changes.")]
    public async Task<string> GetEntitySchema(
        [Description("The entity type name (e.g., 'hero', 'about', 'services')")] string entityType)
    {
        var definition = await _dbContext.EntityDefinitions
            .Where(d => d.PortfolioId == _portfolioId && d.Name == entityType)
            .FirstOrDefaultAsync();

        if (definition == null)
            return $"No content type found with name '{entityType}'. Use list_content_types to see available types.";

        var schema = new
        {
            definition.Name,
            definition.DisplayName,
            definition.Description,
            definition.IsSingleton,
            Attributes = FormatAttributes(definition.Attributes)
        };

        return JsonSerializer.Serialize(schema, new JsonSerializerOptions { WriteIndented = true });
    }

    [KernelFunction("get_page_content")]
    [Description("Get the current published content for a content type. For singletons, returns the single record. For collections, returns the most recently updated record — use recordId or get_content_by_slug to target a specific record.")]
    public async Task<string> GetPageContent(
        [Description("The entity type name (e.g., 'hero', 'about', 'services', 'blog-post')")] string entityType,
        [Description("Optional: specific record ID (GUID) to fetch. Use this for collection items when you know the record ID.")] string? recordId = null)
    {
        IQueryable<FV.Domain.Entities.EntityRecord> query = _dbContext.EntityRecords
            .Where(r => r.PortfolioId == _portfolioId
                     && r.EntityType == entityType
                     && !r.IsDraft);

        FV.Domain.Entities.EntityRecord? record;
        if (!string.IsNullOrEmpty(recordId) && Guid.TryParse(recordId, out var rid))
        {
            record = await query.FirstOrDefaultAsync(r => r.Id == rid);
        }
        else
        {
            record = await query.OrderByDescending(r => r.UpdatedAt).FirstOrDefaultAsync();
        }

        if (record == null)
            return $"No published content found for entity type '{entityType}'" +
                   (recordId != null ? $" with record ID '{recordId}'" : "") + ".";

        // Parse and re-serialize with indentation for readability
        var data = JsonSerializer.Deserialize<JsonElement>(record.JsonData);
        var result = new
        {
            RecordId = record.Id,
            EntityType = record.EntityType,
            Version = record.Version,
            UpdatedAt = record.UpdatedAt,
            Data = data
        };

        var json = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true });

        // Truncate if very large to stay within token limits
        if (json.Length > 4000)
            json = json[..4000] + "\n... (truncated, use specific field paths to query)";

        return json;
    }

    [KernelFunction("get_content_by_slug")]
    [Description("Look up a specific collection record (e.g., blog post, work item) by its slug. Returns the full content. Use this when the user is on a page like /blog/my-post and you need to find the matching blog-post record with slug 'my-post'.")]
    public async Task<string> GetContentBySlug(
        [Description("The entity type name (e.g., 'blog-post', 'work')")] string entityType,
        [Description("The slug to match (e.g., 'ai-approval-flow'). This is searched in the 'slug' field of the JSON data.")] string slug)
    {
        // Search for records where the JSON data contains this slug
        var records = await _dbContext.EntityRecords
            .Where(r => r.PortfolioId == _portfolioId
                     && r.EntityType == entityType
                     && !r.IsDraft)
            .ToListAsync();

        // Find the record whose JSON data has a matching slug field
        FV.Domain.Entities.EntityRecord? matchedRecord = null;
        foreach (var r in records)
        {
            try
            {
                var data = JsonSerializer.Deserialize<JsonElement>(r.JsonData);
                if (data.TryGetProperty("slug", out var slugProp) &&
                    slugProp.ValueKind == JsonValueKind.String &&
                    string.Equals(slugProp.GetString(), slug, StringComparison.OrdinalIgnoreCase))
                {
                    matchedRecord = r;
                    break;
                }
            }
            catch { /* skip malformed records */ }
        }

        if (matchedRecord == null)
            return $"No {entityType} record found with slug '{slug}'. Use list_collection_records to see available items.";

        var result = new
        {
            RecordId = matchedRecord.Id,
            EntityType = matchedRecord.EntityType,
            Slug = slug,
            Version = matchedRecord.Version,
            UpdatedAt = matchedRecord.UpdatedAt,
            Data = JsonSerializer.Deserialize<JsonElement>(matchedRecord.JsonData)
        };

        var json = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true });

        if (json.Length > 4000)
            json = json[..4000] + "\n... (truncated)";

        return json;
    }

    [KernelFunction("get_content_by_route")]
    [Description("Resolve a URL route path to its matching CMS content record. Handles routes like '/blog/my-post' (maps to blog-post with slug 'my-post'), '/work/my-project' (maps to work item), and section pages like '/' (home page sections). Returns the record data or guidance on which content types are relevant.")]
    public async Task<string> GetContentByRoute(
        [Description("The URL path (e.g., '/blog/ai-approval-flow', '/work/my-project', '/')")] string route)
    {
        route = route.Trim().TrimEnd('/');
        if (string.IsNullOrEmpty(route)) route = "/";

        // Known route patterns for portfolio sites:
        // /blog/{slug} -> blog-post collection record with matching slug
        // /work/{slug} -> services/work collection record with matching slug  
        // / -> home page (hero, about, services, contact sections)
        // /admin -> admin panel (not content)

        var segments = route.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length >= 2)
        {
            var prefix = segments[0].ToLowerInvariant();
            var slug = segments[1];

            // Map common route prefixes to entity types
            var entityType = prefix switch
            {
                "blog" => "blog-post",
                "work" => "services",  // work pages often use services entity type
                "project" or "projects" => "services",
                _ => prefix // fallback: use the prefix as entity type
            };

            // Try to find the record by slug
            var records = await _dbContext.EntityRecords
                .Where(r => r.PortfolioId == _portfolioId
                         && r.EntityType == entityType
                         && !r.IsDraft)
                .ToListAsync();

            foreach (var r in records)
            {
                try
                {
                    var data = JsonSerializer.Deserialize<JsonElement>(r.JsonData);
                    if (data.TryGetProperty("slug", out var slugProp) &&
                        slugProp.ValueKind == JsonValueKind.String &&
                        string.Equals(slugProp.GetString(), slug, StringComparison.OrdinalIgnoreCase))
                    {
                        var result = new
                        {
                            RecordId = r.Id,
                            EntityType = r.EntityType,
                            Slug = slug,
                            Route = route,
                            Version = r.Version,
                            UpdatedAt = r.UpdatedAt,
                            Data = JsonSerializer.Deserialize<JsonElement>(r.JsonData)
                        };

                        var json = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true });
                        if (json.Length > 4000)
                            json = json[..4000] + "\n... (truncated)";
                        return json;
                    }
                }
                catch { /* skip */ }
            }

            // If not found with inferred type, try searching all entity types
            if (entityType != prefix)
            {
                var allRecords = await _dbContext.EntityRecords
                    .Where(r => r.PortfolioId == _portfolioId && !r.IsDraft && r.JsonData.Contains(slug))
                    .ToListAsync();

                foreach (var r in allRecords)
                {
                    try
                    {
                        var data = JsonSerializer.Deserialize<JsonElement>(r.JsonData);
                        if (data.TryGetProperty("slug", out var slugProp) &&
                            slugProp.ValueKind == JsonValueKind.String &&
                            string.Equals(slugProp.GetString(), slug, StringComparison.OrdinalIgnoreCase))
                        {
                            var result = new
                            {
                                RecordId = r.Id,
                                EntityType = r.EntityType,
                                Slug = slug,
                                Route = route,
                                Version = r.Version,
                                UpdatedAt = r.UpdatedAt,
                                Data = JsonSerializer.Deserialize<JsonElement>(r.JsonData)
                            };

                            var json = JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true });
                            if (json.Length > 4000)
                                json = json[..4000] + "\n... (truncated)";
                            return json;
                        }
                    }
                    catch { /* skip */ }
                }
            }

            return $"No content record found matching route '{route}'. " +
                   $"Tried entity type '{entityType}' with slug '{slug}'. " +
                   "Use list_content_types and list_collection_records to explore available content.";
        }

        // Root or simple paths — describe what sections are on the page
        if (route == "/")
        {
            var singletons = await _dbContext.EntityDefinitions
                .Where(d => d.PortfolioId == _portfolioId && d.IsSingleton)
                .Select(d => new { d.Name, d.DisplayName })
                .ToListAsync();

            return $"The home page (/) contains these content sections: " +
                   string.Join(", ", singletons.Select(s => $"{s.DisplayName ?? s.Name} (`{s.Name}`)")) +
                   ". Use get_page_content with the section name to fetch specific section content.";
        }

        return $"Route '{route}' doesn't match a known pattern. Use list_content_types to see available content, " +
               "or search_content to find specific text.";
    }

    [KernelFunction("list_collection_records")]
    [Description("List all published records for a collection content type (e.g., blog posts, work items). Returns a summary of each record with its ID, slug, title, and update date. Use this to see all available items in a collection.")]
    public async Task<string> ListCollectionRecords(
        [Description("The entity type name (e.g., 'blog-post', 'services')")] string entityType)
    {
        var records = await _dbContext.EntityRecords
            .Where(r => r.PortfolioId == _portfolioId
                     && r.EntityType == entityType
                     && !r.IsDraft)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();

        if (records.Count == 0)
            return $"No published records found for entity type '{entityType}'.";

        var summaries = records.Select(r =>
        {
            var data = JsonSerializer.Deserialize<JsonElement>(r.JsonData);
            string? slug = null, title = null;
            if (data.TryGetProperty("slug", out var s) && s.ValueKind == JsonValueKind.String)
                slug = s.GetString();
            if (data.TryGetProperty("title", out var t) && t.ValueKind == JsonValueKind.String)
                title = t.GetString();

            return new
            {
                RecordId = r.Id,
                Slug = slug,
                Title = title,
                Version = r.Version,
                UpdatedAt = r.UpdatedAt
            };
        }).ToList();

        return JsonSerializer.Serialize(summaries, new JsonSerializerOptions { WriteIndented = true });
    }

    [KernelFunction("search_content")]
    [Description("Search across all content types for text matching a query. Searches within the JSON data of all published entity records. Use this when you need to find where specific text appears across the portfolio.")]
    public async Task<string> SearchContent(
        [Description("The text to search for within content")] string query)
    {
        var records = await _dbContext.EntityRecords
            .Where(r => r.PortfolioId == _portfolioId
                     && !r.IsDraft
                     && r.JsonData.Contains(query))
            .OrderBy(r => r.EntityType)
            .Take(10)
            .Select(r => new
            {
                r.Id,
                r.EntityType,
                r.Version,
                r.UpdatedAt,
                DataPreview = r.JsonData.Length > 500
                    ? r.JsonData.Substring(0, 500) + "..."
                    : r.JsonData
            })
            .ToListAsync();

        if (records.Count == 0)
            return $"No content found matching '{query}'.";

        return JsonSerializer.Serialize(records, new JsonSerializerOptions { WriteIndented = true });
    }

    [KernelFunction("list_media")]
    [Description("List recently uploaded media assets (images) for this portfolio. Returns file names, URLs, alt text, and upload dates. Use this to see what images are available before proposing image changes.")]
    public async Task<string> ListMedia(
        [Description("Maximum number of results to return (default 20)")] int? limit = 20)
    {
        var take = Math.Clamp(limit ?? 20, 1, 50);

        var assets = await _dbContext.MediaAssets
            .Where(m => m.PortfolioId == _portfolioId)
            .OrderByDescending(m => m.UploadedAt)
            .Take(take)
            .Select(m => new
            {
                m.Id,
                m.FileName,
                Url = m.FilePath,
                m.MimeType,
                m.AltText,
                m.UploadedAt
            })
            .ToListAsync();

        if (assets.Count == 0)
            return "No media assets found for this portfolio. The user needs to upload images first before they can be used in content.";

        return JsonSerializer.Serialize(assets, new JsonSerializerOptions { WriteIndented = true });
    }

    [KernelFunction("search_media_library")]
    [Description("Search the media library for images matching a query. Searches file names and alt text. Use this to find a specific uploaded image to use in a content update.")]
    public async Task<string> SearchMediaLibrary(
        [Description("Search term to match against file names and alt text")] string query)
    {
        var term = query.Trim().ToLower();

        var assets = await _dbContext.MediaAssets
            .Where(m => m.PortfolioId == _portfolioId
                     && (m.FileName.ToLower().Contains(term)
                         || (m.AltText != null && m.AltText.ToLower().Contains(term))))
            .OrderByDescending(m => m.UploadedAt)
            .Take(20)
            .Select(m => new
            {
                m.Id,
                m.FileName,
                Url = m.FilePath,
                m.MimeType,
                m.AltText,
                m.UploadedAt
            })
            .ToListAsync();

        if (assets.Count == 0)
            return $"No media assets found matching '{query}'. The user may need to upload a new image first.";

        return JsonSerializer.Serialize(assets, new JsonSerializerOptions { WriteIndented = true });
    }

    [KernelFunction("propose_content_update")]
    [Description("Propose a change to a specific field in a content type. This does NOT save the change — it queues it for the user to preview and approve. Always call get_page_content first to see current values, and get_entity_schema to understand valid field types. The newValue must be a valid JSON value (strings must be quoted, e.g. '\"Hello World\"'). For collection items (blog posts, work items), you MUST provide the recordId to target the correct record.")]
    public async Task<string> ProposeContentUpdate(
        [Description("The entity type name (e.g., 'hero', 'about', 'services', 'blog-post')")] string entityType,
        [Description("Dot-notation path to the field (e.g., 'title', 'items[0].name', 'description')")] string fieldPath,
        [Description("The new value as a JSON-encoded string (e.g., '\"New Title\"' for strings, '42' for numbers, 'true' for booleans)")] string newValue,
        [Description("A human-readable description of what this change does")] string description,
        [Description("Optional: the specific record ID (GUID) to target. REQUIRED for collection types like blog-post. Get this from get_content_by_route, get_content_by_slug, or list_collection_records.")] string? recordId = null)
    {
        // Find the target record — by ID if provided, otherwise most recent for the entity type
        FV.Domain.Entities.EntityRecord? record;
        if (!string.IsNullOrEmpty(recordId) && Guid.TryParse(recordId, out var rid))
        {
            record = await _dbContext.EntityRecords
                .FirstOrDefaultAsync(r => r.Id == rid
                                       && r.PortfolioId == _portfolioId
                                       && r.EntityType == entityType
                                       && !r.IsDraft);
            if (record == null)
                return $"No published record found with ID '{recordId}' for entity type '{entityType}'. Use list_collection_records to see available records.";
        }
        else
        {
            record = await _dbContext.EntityRecords
                .Where(r => r.PortfolioId == _portfolioId
                         && r.EntityType == entityType
                         && !r.IsDraft)
                .OrderByDescending(r => r.UpdatedAt)
                .FirstOrDefaultAsync();
        }

        if (record == null)
            return $"No published content found for entity type '{entityType}'. Cannot propose changes.";

        // Validate newValue is valid JSON
        try
        {
            JsonSerializer.Deserialize<JsonElement>(newValue);
        }
        catch (JsonException)
        {
            return $"Invalid JSON value: '{newValue}'. Strings must be quoted (e.g., '\"Hello\"'), numbers bare (e.g., '42').";
        }

        // Get the current value at the field path
        var data = JsonSerializer.Deserialize<JsonElement>(record.JsonData);
        var oldValue = GetValueAtPath(data, fieldPath);

        var change = new ProposedChangeResult
        {
            Id = Guid.NewGuid().ToString(),
            EntityType = entityType,
            RecordId = record.Id,
            FieldPath = fieldPath,
            OldValue = oldValue ?? "null",
            NewValue = newValue,
            Description = description
        };

        _proposedChanges.Add(change);

        return $"Change proposed: {description}\n" +
               $"Entity: {entityType}, Field: {fieldPath}\n" +
               $"Old: {Truncate(change.OldValue, 100)}\n" +
               $"New: {Truncate(newValue, 100)}\n" +
               "The user will see a preview and can approve or discard this change.";
    }

    #region Helpers

    private static string? GetValueAtPath(JsonElement root, string fieldPath)
    {
        if (fieldPath == "*")
            return root.GetRawText();

        var parts = fieldPath.Split('.');
        var current = root;

        foreach (var part in parts)
        {
            // Handle array index syntax like "items[0]"
            var arrayMatch = System.Text.RegularExpressions.Regex.Match(part, @"^(\w+)\[(\d+)\]$");

            if (arrayMatch.Success)
            {
                var arrayKey = arrayMatch.Groups[1].Value;
                var index = int.Parse(arrayMatch.Groups[2].Value);

                if (!current.TryGetProperty(arrayKey, out var arrayElement) ||
                    arrayElement.ValueKind != JsonValueKind.Array)
                    return null;

                var arr = arrayElement.EnumerateArray().ToList();
                if (index < 0 || index >= arr.Count)
                    return null;

                current = arr[index];
            }
            else
            {
                if (!current.TryGetProperty(part, out var next))
                    return null;
                current = next;
            }
        }

        return current.ValueKind == JsonValueKind.String
            ? JsonSerializer.Serialize(current.GetString())
            : current.GetRawText();
    }

    private static object FormatAttributes(List<FV.Domain.Entities.AttributeDefinition> attributes)
    {
        return attributes.Select(a => new
        {
            a.Name,
            a.Type,
            a.IsRequired,
            a.Label,
            a.HelpText,
            a.Placeholder,
            a.DefaultValue,
            Children = a.Children != null && a.Children.Count > 0
                ? FormatAttributes(a.Children)
                : null,
            Options = a.Options?.Select(o => new { o.Value, o.Label })
        });
    }

    private static string Truncate(string text, int maxLength)
    {
        return text.Length <= maxLength ? text : text[..maxLength] + "...";
    }

    #endregion
}

/// <summary>
/// Result from ProposeContentUpdate tool — maps to the ProposedChange model.
/// </summary>
public class ProposedChangeResult
{
    public required string Id { get; init; }
    public required string EntityType { get; init; }
    public Guid RecordId { get; init; }
    public required string FieldPath { get; init; }
    public required string OldValue { get; init; }
    public required string NewValue { get; init; }
    public required string Description { get; init; }
}
