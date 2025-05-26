using FV.Domain.Interfaces;

namespace FV.Application.Queries.EntityDefinition;

public class GetEntityDefinitionByIdQuery
{
    public Guid Id { get; set; }
}

public class GetEntityDefinitionByIdQueryHandler
{
    private readonly IUnitOfWork _uow;

    public GetEntityDefinitionByIdQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<FV.Domain.Entities.EntityDefinition?> HandleAsync(GetEntityDefinitionByIdQuery query)
    {
        return await _uow.EntityDefinitions.GetByIdAsync(query.Id);
    }
}
