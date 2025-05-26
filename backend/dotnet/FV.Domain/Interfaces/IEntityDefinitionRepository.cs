using FV.Domain.Entities;

namespace FV.Domain.Interfaces;

public interface IEntityDefinitionRepository : IRepository<EntityDefinition>
{
    Task<EntityDefinition?> GetByNameAsync(string name);
}
