namespace FV.Domain.Interfaces;

public interface IUnitOfWork
{
    IEntityDefinitionRepository EntityDefinitions { get; }
    IEntityRecordRepository EntityRecords { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
