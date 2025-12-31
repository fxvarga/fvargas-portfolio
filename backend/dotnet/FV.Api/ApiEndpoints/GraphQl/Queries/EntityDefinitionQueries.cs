using FV.Application.Queries.EntityDefinition;
using FV.Domain.Entities;

namespace FV.Api.ApiEndpoints.GraphQl.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class EntityDefinitionQueries
{
    public async Task<List<EntityDefinition>> GetAllEntityDefinitions(
        [Service] GetAllEntityDefinitionsQueryHandler handler)
    {
        return await handler.HandleAsync();
    }

    public async Task<EntityDefinition?> GetEntityDefinitionById(
        Guid id,
        [Service] GetEntityDefinitionByIdQueryHandler handler)
    {
        return await handler.HandleAsync(new GetEntityDefinitionByIdQuery { Id = id });
    }
}
