using FV.Domain.Interfaces;

namespace FV.Application.Queries.EntityRecord;

public class GetEntityRecordByIdQuery
{
    public Guid Id { get; set; }
}

public class GetEntityRecordByIdQueryHandler
{
    private readonly IUnitOfWork _uow;

    public GetEntityRecordByIdQueryHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<FV.Domain.Entities.EntityRecord?> HandleAsync(GetEntityRecordByIdQuery query)
    {
        return await _uow.EntityRecords.GetByIdAsync(query.Id);
    }
}
