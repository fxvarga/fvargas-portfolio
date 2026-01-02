using System.Text.Json;
using FV.Domain.Entities;
using FV.Domain.Interfaces;
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
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return new List<ContentRecord>();
        }

        var records = await dbContext.EntityRecords
            .Where(r => r.PortfolioId == tenantContext.PortfolioId 
                     && r.EntityType == entityType 
                     && !r.IsDraft)
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
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return null;
        }

        var record = await dbContext.EntityRecords
            .Where(r => r.PortfolioId == tenantContext.PortfolioId 
                     && r.EntityType == entityType 
                     && !r.IsDraft)
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
    public async Task<PortfolioContent> GetPortfolioContent(
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return new PortfolioContent();
        }

        var records = await dbContext.EntityRecords
            .Where(r => r.PortfolioId == tenantContext.PortfolioId && !r.IsDraft)
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
            Footer = GetContentData(contentByType, "footer"),
            // Additional content types for Jessica portfolio
            Portfolio = GetContentData(contentByType, "portfolio"),
            // Additional content types for Busybee portfolio
            Stats = GetContentData(contentByType, "stats"),
            Testimonials = GetContentData(contentByType, "testimonials")
        };
    }

    /// <summary>
    /// Get all published content for multiple entity types in a single query.
    /// Returns a dictionary keyed by entity type.
    /// </summary>
    public async Task<List<ContentByTypeResult>> GetContentByTypes(
        List<string> entityTypes,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return entityTypes.Select(type => new ContentByTypeResult
            {
                EntityType = type,
                Data = null,
                Id = null,
                Version = 0,
                UpdatedAt = null
            }).ToList();
        }

        var records = await dbContext.EntityRecords
            .Where(r => r.PortfolioId == tenantContext.PortfolioId 
                     && entityTypes.Contains(r.EntityType) 
                     && !r.IsDraft)
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
    /// Returns all records for non-singleton types, and only the most recent for singleton types.
    /// </summary>
    public async Task<List<ContentRecord>> GetAllPublishedContent(
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return new List<ContentRecord>();
        }

        // Get entity definitions to know which are singletons
        var entityDefinitions = await dbContext.EntityDefinitions
            .Where(d => d.PortfolioId == tenantContext.PortfolioId)
            .ToListAsync();
        
        var singletonTypes = entityDefinitions
            .Where(d => d.IsSingleton)
            .Select(d => d.Name)
            .ToHashSet();

        var records = await dbContext.EntityRecords
            .Where(r => r.PortfolioId == tenantContext.PortfolioId && !r.IsDraft)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();

        // For singleton types, take only the most recent; for non-singletons, take all
        var result = new List<EntityRecord>();
        var singletonsSeen = new HashSet<string>();
        
        foreach (var record in records)
        {
            if (singletonTypes.Contains(record.EntityType))
            {
                // Singleton: only add if we haven't seen this type yet
                if (!singletonsSeen.Contains(record.EntityType))
                {
                    result.Add(record);
                    singletonsSeen.Add(record.EntityType);
                }
            }
            else
            {
                // Non-singleton: add all records
                result.Add(record);
            }
        }

        return result.Select(r => new ContentRecord
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

    // Additional content types for Jessica portfolio
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Portfolio { get; set; }

    // Additional content types for Busybee portfolio
    [GraphQLType(typeof(AnyType))]
    public JsonElement? Stats { get; set; }

    [GraphQLType(typeof(AnyType))]
    public JsonElement? Testimonials { get; set; }
}
