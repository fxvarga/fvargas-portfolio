using FV.Domain.Interfaces;

namespace FV.Application.Queries.EntityRecord;

public class GetEntityRecordsByTypeQuery
{
    public string EntityType { get; set; } = default!;
}

public class GetEntityRecordsByTypeQueryHandler
{
    private readonly IUnitOfWork _uow;

    public GetEntityRecordsByTypeQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<List<FV.Domain.Entities.EntityRecord>> HandleAsync(GetEntityRecordsByTypeQuery query)
    {
        return await _uow.EntityRecords.GetByEntityTypeAsync(query.EntityType);
    }
}
