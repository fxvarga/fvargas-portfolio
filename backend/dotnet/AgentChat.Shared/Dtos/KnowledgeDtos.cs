using System.Text.Json;

namespace AgentChat.Shared.Dtos;

/// <summary>
/// Knowledge item types
/// </summary>
public enum KnowledgeItemType
{
    Procedure,
    Policy,
    Standard,
    Template
}

/// <summary>
/// Unified knowledge item DTO for API responses
/// </summary>
public record KnowledgeItemDto
{
    public string Id { get; init; } = string.Empty;
    public KnowledgeItemType Type { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Version { get; init; }
    public string? Category { get; init; }
    public string? Subcategory { get; init; }
    public List<string> Tags { get; init; } = new();
    
    // Type-specific metadata
    public string? Owner { get; init; }
    public string? EffectiveDate { get; init; }
    public string? Codification { get; init; }
    public int? StepCount { get; init; }
    
    // Full content as JSON for detailed view
    public JsonElement? Content { get; init; }
}

/// <summary>
/// Summary view for list displays
/// </summary>
public record KnowledgeItemSummaryDto
{
    public string Id { get; init; } = string.Empty;
    public KnowledgeItemType Type { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Category { get; init; }
    public string? Subcategory { get; init; }
    public List<string> Tags { get; init; } = new();
}

/// <summary>
/// Request to search knowledge items
/// </summary>
public record KnowledgeSearchRequest
{
    public KnowledgeItemType? Type { get; init; }
    public string? Category { get; init; }
    public string? Subcategory { get; init; }
    public string? Keyword { get; init; }
    public List<string>? Tags { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 50;
}

/// <summary>
/// Paginated response for knowledge items
/// </summary>
public record KnowledgeSearchResponse
{
    public List<KnowledgeItemSummaryDto> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Skip { get; init; }
    public int Take { get; init; }
}

/// <summary>
/// Available categories and tags for filtering
/// </summary>
public record KnowledgeMetadataDto
{
    public List<string> Categories { get; init; } = new();
    public List<string> Subcategories { get; init; } = new();
    public List<string> Tags { get; init; } = new();
    public Dictionary<KnowledgeItemType, int> TypeCounts { get; init; } = new();
}
