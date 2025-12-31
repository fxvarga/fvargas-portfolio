using System.Text.Json;
using FV.Application.Commands.EntityRecord;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class EntityRecordMutations
{
    public async Task<Guid> CreateEntityRecord(
        CreateEntityRecordInput input,
        [Service] CreateEntityRecordHandler handler)
    {
        var dataDict = JsonSerializer.Deserialize<Dictionary<string, object?>>(input.Data.GetRawText())!;

        var command = new CreateEntityRecordCommand
        {
            EntityType = input.EntityType,
            Data = dataDict
        };

        return await handler.HandleAsync(command);
    }
}
