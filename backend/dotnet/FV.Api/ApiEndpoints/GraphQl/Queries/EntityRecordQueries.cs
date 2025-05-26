using FV.Application.Queries.EntityRecord;

namespace FV.API.GraphQL.Queries;

[ExtendObjectType(OperationTypeNames.Query)]
public class EntityRecordQueries
{
    public async Task<List<FV.Domain.Entities.EntityRecord>> GetEntityRecords(
        string entityType,
        [Service] GetEntityRecordsByTypeQueryHandler handler)
    {
        return await handler.HandleAsync(new GetEntityRecordsByTypeQuery { EntityType = entityType });
    }

    public async Task<FV.Domain.Entities.EntityRecord?> GetEntityRecordById(
        Guid id,
        [Service] GetEntityRecordByIdQueryHandler handler)
    {
        return await handler.HandleAsync(new GetEntityRecordByIdQuery { Id = id });
    }
}
