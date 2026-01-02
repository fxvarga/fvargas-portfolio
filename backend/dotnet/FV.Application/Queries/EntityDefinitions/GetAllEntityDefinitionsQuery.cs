using FV.Domain.Interfaces;

namespace FV.Application.Queries.EntityDefinition;

public class GetAllEntityDefinitionsQueryHandler
{
    private readonly IUnitOfWork _uow;

    public GetAllEntityDefinitionsQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<FV.Domain.Entities.EntityDefinition>> HandleAsync()
    {
        return await _uow.EntityDefinitions.GetAllAsync();
    }
}
