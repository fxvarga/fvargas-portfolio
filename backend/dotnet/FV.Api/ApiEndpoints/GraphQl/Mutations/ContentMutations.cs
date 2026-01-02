using System.Text.Json;
using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using FV.Api.ApiEndpoints.GraphQl.Queries;
using FV.Application.Services;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class ContentMutations
{
    private readonly SchemaValidationService _validationService = new();

    /// <summary>
    /// Create a new content record (protected - requires authentication)
    /// </summary>
    [Authorize]
    public async Task<ContentMutationPayload> CreateContent(
        CreateContentInput input,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        try
        {
            if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
            {
                return new ContentMutationPayload
                {
                    Success = false,
                    ErrorMessage = "Tenant context not resolved"
                };
            }

            var portfolioId = tenantContext.PortfolioId.Value;

            // Validate against schema if entity definition exists (scoped to tenant)
            var definition = await dbContext.EntityDefinitions
                .FirstOrDefaultAsync(d => d.Name == input.EntityType && d.PortfolioId == portfolioId);
            
            if (definition != null)
            {
                var validationResult = _validationService.Validate(definition, input.Data);
                if (!validationResult.IsValid)
                {
                    return new ContentMutationPayload
                    {
                        Success = false,
                        ErrorMessage = "Validation failed",
                        ValidationErrors = validationResult.Errors
                            .Select(e => new ContentValidationError { Field = e.Field, Message = e.Message })
                            .ToList()
                    };
                }
            }

            var record = new EntityRecord
            {
                Id = Guid.NewGuid(),
                EntityType = input.EntityType,
                JsonData = input.Data.GetRawText(),
                IsDraft = input.IsDraft ?? true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 1,
                PublishedAt = input.IsDraft == false ? DateTime.UtcNow : null,
                PortfolioId = portfolioId
            };

            dbContext.EntityRecords.Add(record);
            await dbContext.SaveChangesAsync();

            return new ContentMutationPayload
            {
                Success = true,
                Record = ToContentRecord(record)
            };
        }
        catch (Exception ex)
        {
            return new ContentMutationPayload
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Update an existing content record (protected - requires authentication)
    /// </summary>
    [Authorize]
    public async Task<ContentMutationPayload> UpdateContent(
        UpdateContentInput input,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        try
        {
            if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
            {
                return new ContentMutationPayload
                {
                    Success = false,
                    ErrorMessage = "Tenant context not resolved"
                };
            }

            var portfolioId = tenantContext.PortfolioId.Value;

            // Find record scoped to tenant
            var record = await dbContext.EntityRecords
                .FirstOrDefaultAsync(r => r.Id == input.Id && r.PortfolioId == portfolioId);
            if (record == null)
            {
                return new ContentMutationPayload
                {
                    Success = false,
                    ErrorMessage = "Content record not found"
                };
            }

            // Validate against schema if entity definition exists (scoped to tenant)
            var definition = await dbContext.EntityDefinitions
                .FirstOrDefaultAsync(d => d.Name == record.EntityType && d.PortfolioId == portfolioId);
            
            if (definition != null)
            {
                var validationResult = _validationService.Validate(definition, input.Data);
                if (!validationResult.IsValid)
                {
                    return new ContentMutationPayload
                    {
                        Success = false,
                        ErrorMessage = "Validation failed",
                        ValidationErrors = validationResult.Errors
                            .Select(e => new ContentValidationError { Field = e.Field, Message = e.Message })
                            .ToList()
                    };
                }
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
            dbContext.EntityRecordVersions.Add(versionRecord);

            // Update the record
            record.JsonData = input.Data.GetRawText();
            record.UpdatedAt = DateTime.UtcNow;
            record.Version++;

            if (input.Publish == true && record.IsDraft)
            {
                record.IsDraft = false;
                record.PublishedAt = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync();

            return new ContentMutationPayload
            {
                Success = true,
                Record = ToContentRecord(record)
            };
        }
        catch (Exception ex)
        {
            return new ContentMutationPayload
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Publish a draft content record (protected - requires authentication)
    /// </summary>
    [Authorize]
    public async Task<ContentMutationPayload> PublishContent(
        Guid id,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        try
        {
            if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
            {
                return new ContentMutationPayload
                {
                    Success = false,
                    ErrorMessage = "Tenant context not resolved"
                };
            }

            var portfolioId = tenantContext.PortfolioId.Value;

            // Find record scoped to tenant
            var record = await dbContext.EntityRecords
                .FirstOrDefaultAsync(r => r.Id == id && r.PortfolioId == portfolioId);
            if (record == null)
            {
                return new ContentMutationPayload
                {
                    Success = false,
                    ErrorMessage = "Content record not found"
                };
            }

            record.IsDraft = false;
            record.PublishedAt = DateTime.UtcNow;
            record.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync();

            return new ContentMutationPayload
            {
                Success = true,
                Record = ToContentRecord(record)
            };
        }
        catch (Exception ex)
        {
            return new ContentMutationPayload
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Delete a content record (protected - requires Admin role)
    /// </summary>
    [Authorize(Roles = new[] { "Admin" })]
    public async Task<ContentMutationPayload> DeleteContent(
        Guid id,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        try
        {
            if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
            {
                return new ContentMutationPayload
                {
                    Success = false,
                    ErrorMessage = "Tenant context not resolved"
                };
            }

            var portfolioId = tenantContext.PortfolioId.Value;

            // Find record scoped to tenant
            var record = await dbContext.EntityRecords
                .FirstOrDefaultAsync(r => r.Id == id && r.PortfolioId == portfolioId);
            if (record == null)
            {
                return new ContentMutationPayload
                {
                    Success = false,
                    ErrorMessage = "Content record not found"
                };
            }

            dbContext.EntityRecords.Remove(record);
            await dbContext.SaveChangesAsync();

            return new ContentMutationPayload
            {
                Success = true
            };
        }
        catch (Exception ex)
        {
            return new ContentMutationPayload
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// Get all content records including drafts (protected - for CMS admin)
    /// </summary>
    [Authorize]
    [GraphQLName("getAllContentAdmin")]
    public async Task<List<Queries.ContentRecord>> GetAllContentAdmin(
        string? entityType,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            return new List<Queries.ContentRecord>();
        }

        var portfolioId = tenantContext.PortfolioId.Value;
        var query = dbContext.EntityRecords
            .Where(r => r.PortfolioId == portfolioId);

        if (!string.IsNullOrEmpty(entityType))
        {
            query = query.Where(r => r.EntityType == entityType);
        }

        var records = await query.OrderByDescending(r => r.UpdatedAt).ToListAsync();

        return records.Select(ToContentRecord).ToList();
    }

    private static Queries.ContentRecord ToContentRecord(EntityRecord record)
    {
        return new Queries.ContentRecord
        {
            Id = record.Id,
            EntityType = record.EntityType,
            Data = JsonSerializer.Deserialize<JsonElement>(record.JsonData),
            Version = record.Version,
            PublishedAt = record.PublishedAt,
            UpdatedAt = record.UpdatedAt
        };
    }
}

// Input types
public class CreateContentInput
{
    public string EntityType { get; set; } = default!;
    public JsonElement Data { get; set; }
    public bool? IsDraft { get; set; }
}

public class UpdateContentInput
{
    public Guid Id { get; set; }
    public JsonElement Data { get; set; }
    public bool? Publish { get; set; }
}

// Payload types
public class ContentMutationPayload
{
    public bool Success { get; set; }
    public Queries.ContentRecord? Record { get; set; }
    public string? ErrorMessage { get; set; }
    public List<ContentValidationError>? ValidationErrors { get; set; }
}

/// <summary>
/// Represents a validation error for a specific field
/// </summary>
public class ContentValidationError
{
    public string Field { get; set; } = default!;
    public string Message { get; set; } = default!;
}
