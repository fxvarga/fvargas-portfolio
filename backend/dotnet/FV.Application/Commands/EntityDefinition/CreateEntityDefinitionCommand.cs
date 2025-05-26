using FV.Domain.Entities;
using FV.Domain.Interfaces;

namespace FV.Application.Commands.EntityDefinition;

public class CreateEntityDefinitionCommand
{
    public string Name { get; set; } = default!;
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
            Attributes = command.Attributes.Select(a => new AttributeDefinition
            {
                Id = Guid.NewGuid(),
                Name = a.Name,
                Type = a.Type,
                IsRequired = a.IsRequired,
                TargetEntity = a.TargetEntity
            }).ToList(),
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
}
