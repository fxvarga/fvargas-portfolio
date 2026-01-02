using FV.Application.Dtos;
using FV.Domain.Entities;
using FV.Domain.Interfaces;

namespace FV.Application.Commands.EntityDefinition;

public class CreateEntityDefinitionCommand
{
    public string Name { get; set; } = default!;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool IsSingleton { get; set; } = true;
    public string? Category { get; set; }
    public List<AttributeDto> Attributes { get; set; } = new();
    public List<RelationshipDto> Relationships { get; set; } = new();
}

public class CreateEntityDefinitionCommandHandler
{
    private readonly IUnitOfWork _uow;

    public CreateEntityDefinitionCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Guid> HandleAsync(CreateEntityDefinitionCommand command)
    {
        var entity = new Domain.Entities.EntityDefinition
        {
            Id = Guid.NewGuid(),
            Name = command.Name,
            DisplayName = command.DisplayName,
            Description = command.Description,
            Icon = command.Icon,
            IsSingleton = command.IsSingleton,
            Category = command.Category,
            Attributes = MapAttributes(command.Attributes),
            Relationships = command.Relationships.Select(r => new RelationshipDefinition
            {
                Id = Guid.NewGuid(),
                Name = r.Name,
                TargetEntityId = r.TargetEntityId,
                Type = r.Type
            }).ToList() ?? new List<RelationshipDefinition>(),
        };

        await _uow.EntityDefinitions.AddAsync(entity);
        await _uow.SaveChangesAsync();
        return entity.Id;
    }

    private static List<AttributeDefinition> MapAttributes(List<AttributeDto> dtos)
    {
        return dtos.Select((a, index) => new AttributeDefinition
        {
            Id = a.Id ?? Guid.NewGuid(),
            Name = a.Name,
            Type = a.Type,
            IsRequired = a.IsRequired,
            Label = a.Label,
            HelpText = a.HelpText,
            Placeholder = a.Placeholder,
            DefaultValue = a.DefaultValue,
            TargetEntity = a.TargetEntity,
            Validation = a.Validation,
            Options = a.Options?.Select(o => new SelectOption
            {
                Value = o.Value,
                Label = o.Label
            }).ToList(),
            Children = a.Children != null ? MapAttributes(a.Children) : null,
            Order = a.Order > 0 ? a.Order : index
        }).ToList();
    }
}
