using System.Text.Json;
using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class EntityRecordMutations
{
    public async Task<Guid> CreateEntityRecord(
        CreateEntityRecordInput input,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
        {
            throw new InvalidOperationException("Tenant context not resolved");
        }

        var record = new EntityRecord
        {
            Id = Guid.NewGuid(),
            EntityType = input.EntityType,
            JsonData = input.Data.GetRawText(),
            IsDraft = true, // Default to draft
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Version = 1,
            PublishedAt = null,
            PortfolioId = tenantContext.PortfolioId.Value
        };

        dbContext.EntityRecords.Add(record);
        await dbContext.SaveChangesAsync();
        return record.Id;
    }
}
