using FV.Application.Queries.EntityDefinition;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class EntityDefinitionQueries
{
    public async Task<List<EntityDefinition>> GetAllEntityDefinitions(
        [Service] CmsDbContext dbContext)
    {
        return await dbContext.EntityDefinitions.ToListAsync();
    }

    public async Task<EntityDefinition?> GetEntityDefinitionById(
        Guid id,
        [Service] CmsDbContext dbContext)
    {
        return await dbContext.EntityDefinitions
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<EntityDefinition?> GetEntityDefinitionByName(
        string name,
        [Service] CmsDbContext dbContext)
    {
        return await dbContext.EntityDefinitions
            .FirstOrDefaultAsync(e => e.Name == name);
    }
}
