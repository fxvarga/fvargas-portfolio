using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class EntityDefinitionQueries
{
    public async Task<List<EntityDefinition>> GetAllEntityDefinitions(
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return new List<EntityDefinition>();
        }

        return await dbContext.EntityDefinitions
            .Where(e => e.PortfolioId == tenantContext.PortfolioId)
            .ToListAsync();
    }

    public async Task<EntityDefinition?> GetEntityDefinitionById(
        Guid id,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return null;
        }

        return await dbContext.EntityDefinitions
            .Where(e => e.PortfolioId == tenantContext.PortfolioId)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<EntityDefinition?> GetEntityDefinitionByName(
        string name,
        [Service] CmsDbContext dbContext,
        [Service] ITenantContext tenantContext)
    {
        if (!tenantContext.IsResolved)
        {
            return null;
        }

        return await dbContext.EntityDefinitions
            .Where(e => e.PortfolioId == tenantContext.PortfolioId)
            .FirstOrDefaultAsync(e => e.Name == name);
    }
}
