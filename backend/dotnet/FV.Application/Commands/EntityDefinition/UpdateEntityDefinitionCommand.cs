using FV.Application.Dtos;
using FV.Domain.Entities;
using FV.Domain.Interfaces;

namespace FV.Application.Commands.EntityDefinition;

public class UpdateEntityDefinitionCommand
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool? IsSingleton { get; set; }
    public string? Category { get; set; }
    public List<AttributeDto>? Attributes { get; set; }
}

public class UpdateEntityDefinitionCommandHandler
{
    private readonly IUnitOfWork _uow;

    public UpdateEntityDefinitionCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task HandleAsync(UpdateEntityDefinitionCommand command)
    {
        var entity = await _uow.EntityDefinitions.GetByIdAsync(command.Id);
        if (entity == null) throw new Exception("Entity not found.");

        if (!string.IsNullOrWhiteSpace(command.Name))
            entity.Name = command.Name;

        if (command.DisplayName != null)
            entity.DisplayName = command.DisplayName;

        if (command.Description != null)
            entity.Description = command.Description;

        if (command.Icon != null)
            entity.Icon = command.Icon;

        if (command.IsSingleton.HasValue)
            entity.IsSingleton = command.IsSingleton.Value;

        if (command.Category != null)
            entity.Category = command.Category;

        if (command.Attributes != null)
            entity.Attributes = MapAttributes(command.Attributes);

        entity.UpdatedAt = DateTime.UtcNow;
        entity.Version++;

        _uow.EntityDefinitions.Update(entity);
        await _uow.SaveChangesAsync();
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
