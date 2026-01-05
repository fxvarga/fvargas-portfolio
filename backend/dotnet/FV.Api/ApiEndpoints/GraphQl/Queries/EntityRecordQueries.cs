using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class EntityRecordQueries
{
    public async Task<List<EntityRecord>> GetEntityRecords(
        string entityType,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return new List<EntityRecord>();
        }

        return await dbContext.EntityRecords
            .Where(r => r.PortfolioId == tenantContext.PortfolioId
                     && r.EntityType == entityType)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();
    }

    public async Task<EntityRecord?> GetEntityRecordById(
        Guid id,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return null;
        }

        return await dbContext.EntityRecords
            .Where(r => r.PortfolioId == tenantContext.PortfolioId)
            .FirstOrDefaultAsync(r => r.Id == id);
    }
}
