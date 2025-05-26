using FV.Domain.Entities;

namespace FV.Domain.Interfaces;

public interface IEntityRecordRepository : IRepository<EntityRecord>
{
    Task<List<EntityRecord>> GetByEntityTypeAsync(string entityType);
    Task ClearAllAsync();
}
