using FV.Application.Commands.EntityDefinition;
using FV.Application.Dtos;

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
            DisplayName = input.DisplayName,
            Description = input.Description,
            Icon = input.Icon,
            IsSingleton = input.IsSingleton,
            Category = input.Category,
            Attributes = MapAttributeInputs(input.Attributes),
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
            Name = input.Name,
            DisplayName = input.DisplayName,
            Description = input.Description,
            Icon = input.Icon,
            IsSingleton = input.IsSingleton,
            Category = input.Category,
            Attributes = input.Attributes != null ? MapAttributeInputs(input.Attributes) : null
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

    private static List<AttributeDto> MapAttributeInputs(List<AttributeInput> inputs)
    {
        return inputs.Select(a => new AttributeDto
        {
            Id = a.Id,
            Name = a.Name,
            Type = a.Type,
            IsRequired = a.IsRequired,
            Label = a.Label,
            HelpText = a.HelpText,
            Placeholder = a.Placeholder,
            DefaultValue = a.DefaultValue,
            TargetEntity = a.TargetEntity,
            Validation = a.Validation,
            Options = a.Options?.Select(o => new SelectOptionDto
            {
                Value = o.Value,
                Label = o.Label
            }).ToList(),
            Children = a.Children != null ? MapAttributeInputs(a.Children) : null,
            Order = a.Order
        }).ToList();
    }
}
