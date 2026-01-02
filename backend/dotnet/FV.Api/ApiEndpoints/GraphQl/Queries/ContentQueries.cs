using System.Text.Json;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class ContentQueries
{
    /// <summary>
    /// Get all published content records of a specific type (e.g., "site-config", "hero", "about")
    /// </summary>
    public async Task<List<ContentRecord>> GetPublishedContent(
        string entityType,
        [Service] CmsDbContext dbContext)
    {
        var records = await dbContext.EntityRecords
            .Where(r => r.EntityType == entityType && !r.IsDraft)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();

        return records.Select(r => new ContentRecord
        {
            Id = r.Id,
            EntityType = r.EntityType,
            Data = JsonSerializer.Deserialize<JsonElement>(r.JsonData),
            Version = r.Version,
            PublishedAt = r.PublishedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();
    }

    /// <summary>
    /// Get a single published content record by entity type (for singleton content like site-config, hero, etc.)
    /// </summary>
    public async Task<ContentRecord?> GetPublishedContentSingle(
        string entityType,
        [Service] CmsDbContext dbContext)
    {
        var record = await dbContext.EntityRecords
            .Where(r => r.EntityType == entityType && !r.IsDraft)
            .OrderByDescending(r => r.UpdatedAt)
            .FirstOrDefaultAsync();

        if (record == null) return null;

        return new ContentRecord
        {
            Id = record.Id,
            EntityType = record.EntityType,
            Data = JsonSerializer.Deserialize<JsonElement>(record.JsonData),
            Version = record.Version,
            PublishedAt = record.PublishedAt,
            UpdatedAt = record.UpdatedAt
        };
    }

    /// <summary>
    /// Get all CMS data for the portfolio site in a single query (legacy - kept for backwards compatibility)
    /// </summary>
    [Obsolete("Use GetContentByTypes instead for a more flexible approach")]
    public async Task<PortfolioContent> GetPortfolioContent([Service] CmsDbContext dbContext)
    {
        var records = await dbContext.EntityRecords
            .Where(r => !r.IsDraft)
            .ToListAsync();

        var contentByType = records
            .GroupBy(r => r.EntityType)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(r => r.UpdatedAt).First()
            );

        return new PortfolioContent
        {
            SiteConfig = GetContentData(contentByType, "site-config"),
            Hero = GetContentData(contentByType, "hero"),
            About = GetContentData(contentByType, "about"),
            Services = GetContentData(contentByType, "services"),
            Contact = GetContentData(contentByType, "contact"),
            Navigation = GetContentData(contentByType, "navigation"),
            Footer = GetContentData(contentByType, "footer")
        };
    }

    /// <summary>
    /// Get all published content for multiple entity types in a single query.
    /// Returns a dictionary keyed by entity type.
    /// </summary>
    public async Task<List<ContentByTypeResult>> GetContentByTypes(
        List<string> entityTypes,
        [Service] CmsDbContext dbContext)
    {
        var records = await dbContext.EntityRecords
            .Where(r => entityTypes.Contains(r.EntityType) && !r.IsDraft)
            .ToListAsync();

        var contentByType = records
            .GroupBy(r => r.EntityType)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(r => r.UpdatedAt).First()
            );

        return entityTypes.Select(type => new ContentByTypeResult
        {
            EntityType = type,
            Data = contentByType.TryGetValue(type, out var record) 
                ? JsonSerializer.Deserialize<JsonElement>(record.JsonData)
                : null,
            Id = contentByType.TryGetValue(type, out var r) ? r.Id : null,
            Version = contentByType.TryGetValue(type, out var v) ? v.Version : 0,
            UpdatedAt = contentByType.TryGetValue(type, out var u) ? u.UpdatedAt : null
        }).ToList();
    }

    /// <summary>
    /// Get all published content records (for all entity types)
    /// </summary>
    public async Task<List<ContentRecord>> GetAllPublishedContent([Service] CmsDbContext dbContext)
    {
        var records = await dbContext.EntityRecords
            .Where(r => !r.IsDraft)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();

        // Group by type and take the most recent for each
        var latestByType = records
            .GroupBy(r => r.EntityType)
            .Select(g => g.First())
            .ToList();

        return latestByType.Select(r => new ContentRecord
        {
            Id = r.Id,
            EntityType = r.EntityType,
            Data = JsonSerializer.Deserialize<JsonElement>(r.JsonData),
            Version = r.Version,
            PublishedAt = r.PublishedAt,
            UpdatedAt = r.UpdatedAt
        }).ToList();
    }

    private static JsonElement? GetContentData(
        Dictionary<string, EntityRecord> contentByType, 
        string entityType)
    {
        if (!contentByType.TryGetValue(entityType, out var record)) return null;
        return JsonSerializer.Deserialize<JsonElement>(record.JsonData);
    }
}

// GraphQL types for content
public class ContentRecord
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = default!;
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement Data { get; set; }
    
    public int Version { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ContentByTypeResult
{
    public string EntityType { get; set; } = default!;
    public Guid? Id { get; set; }
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Data { get; set; }
    
    public int Version { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class PortfolioContent
{
    [GraphQLType(typeof(AnyType))]
    public JsonElement? SiteConfig { get; set; }
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Hero { get; set; }
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement? About { get; set; }
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Services { get; set; }
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Contact { get; set; }
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Navigation { get; set; }
    
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Footer { get; set; }
}
