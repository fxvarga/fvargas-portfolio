using FV.Domain.Interfaces;

namespace FV.Application.Commands.EntityDefinition;

public class UpdateEntityDefinitionCommand
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
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

        _uow.EntityDefinitions.Update(entity);
        await _uow.SaveChangesAsync();
    }
}
