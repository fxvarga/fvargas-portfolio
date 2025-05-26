using FV.Domain.Interfaces;

namespace FV.Infrastructure.Persistence.FileStorage;

public class FileBasedUnitOfWork : IUnitOfWork
{
    public IEntityDefinitionRepository EntityDefinitions { get; }
    public IEntityRecordRepository EntityRecords { get; }

    public FileBasedUnitOfWork()
    {
        EntityDefinitions = new FileEntityDefinitionRepository();
        EntityRecords = new FileEntityRecordRepository();
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // No-op for file system
        return Task.FromResult(1);
    }
}
