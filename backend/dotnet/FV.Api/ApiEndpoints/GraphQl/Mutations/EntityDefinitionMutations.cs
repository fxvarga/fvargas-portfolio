using FV.Application.Commands.EntityDefinition;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class EntityDefinitionMutations
{
    public async Task<Guid> CreateEntityDefinition(
        CreateEntityInput input,
        [Service] CreateEntityDefinitionCommandHandler handler)
    {
        var command = new CreateEntityDefinitionCommand
        {
            Name = input.Name,
            Attributes = input.Attributes.Select(a => new AttributeDto
            {
                Name = a.Name,
                Type = a.Type,
                IsRequired = a.IsRequired,
                TargetEntity = a.TargetEntity
            }).ToList(),
            Relationships = input.Relationships?.Select(r => new RelationshipDto
            {
                Name = r.Name,
                TargetEntityId = r.TargetEntityId,
                Type = r.Type
            }).ToList() ?? new List<RelationshipDto>(),
        };

        return await handler.HandleAsync(command);
    }

    public async Task<bool> UpdateEntityDefinition(
        UpdateEntityDefinitionInput input,
        [Service] UpdateEntityDefinitionCommandHandler handler)
    {
        var command = new UpdateEntityDefinitionCommand
        {
            Id = input.Id,
            Name = input.Name
        };

        await handler.HandleAsync(command);
        return true;
    }

    public async Task<bool> DeleteEntityDefinition(
        Guid id,
        [Service] DeleteEntityDefinitionCommandHandler handler)
    {
        await handler.HandleAsync(new DeleteEntityDefinitionCommand { Id = id });
        return true;
    }
}
