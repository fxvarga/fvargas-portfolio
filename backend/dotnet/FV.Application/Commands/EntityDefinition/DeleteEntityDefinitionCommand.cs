using FV.Domain.Interfaces;

namespace FV.Application.Commands.EntityDefinition;

public class DeleteEntityDefinitionCommand
{
    public Guid Id { get; set; }
}

public class DeleteEntityDefinitionCommandHandler
{
    private readonly IUnitOfWork _uow;
    private readonly ITenantContext _tenantContext;

    public DeleteEntityDefinitionCommandHandler(IUnitOfWork uow, ITenantContext tenantContext)
    {
        _uow = uow;
        _tenantContext = tenantContext;
    }

    public async Task HandleAsync(DeleteEntityDefinitionCommand command)
    {
        if (!_tenantContext.IsResolved || !_tenantContext.PortfolioId.HasValue)
        {
            throw new InvalidOperationException("Tenant context not resolved");
        }

        var entity = await _uow.EntityDefinitions.GetByIdAsync(command.Id);
        if (entity == null) throw new Exception("Entity not found.");

        // Verify tenant access
        if (entity.PortfolioId != _tenantContext.PortfolioId.Value)
        {
            throw new UnauthorizedAccessException("Entity does not belong to current tenant");
        }

        _uow.EntityDefinitions.Remove(entity);
        await _uow.SaveChangesAsync();
    }
}
