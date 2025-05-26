using FV.Domain.Interfaces;

namespace FV.Application.Commands.EntityDefinition;

public class DeleteEntityDefinitionCommand
{
    public Guid Id { get; set; }
}

public class DeleteEntityDefinitionCommandHandler
{
    private readonly IUnitOfWork _uow;

    public DeleteEntityDefinitionCommandHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task HandleAsync(DeleteEntityDefinitionCommand command)
    {
        var entity = await _uow.EntityDefinitions.GetByIdAsync(command.Id);
        if (entity == null) throw new Exception("Entity not found.");

        _uow.EntityDefinitions.Remove(entity);
        await _uow.SaveChangesAsync();
    }
}
