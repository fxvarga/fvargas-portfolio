using System.Text.Json;
using FV.Domain.Interfaces;

namespace FV.Application.Commands.EntityRecord;

public class CreateEntityRecordCommand
{
    public string EntityType { get; set; } = default!;
    public Dictionary<string, object?> Data { get; set; } = new();
}

public class CreateEntityRecordHandler
{
    private readonly IUnitOfWork _uow;
    private readonly ITenantContext _tenantContext;

    public CreateEntityRecordHandler(IUnitOfWork uow, ITenantContext tenantContext)
    {
        _uow = uow;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateEntityRecordCommand command)
    {
        if (!_tenantContext.IsResolved || !_tenantContext.PortfolioId.HasValue)
        {
            throw new InvalidOperationException("Tenant context not resolved");
        }

        var portfolioId = _tenantContext.PortfolioId.Value;

        var definition = await _uow.EntityDefinitions.GetByNameAsync(command.EntityType);
        if (definition == null)
            throw new Exception($"Entity type '{command.EntityType}' is not defined.");

        // Verify the definition belongs to the current tenant
        if (definition.PortfolioId != portfolioId)
            throw new Exception($"Entity type '{command.EntityType}' is not defined for this tenant.");

        // TODO: Add schema-based validation here

        var record = new FV.Domain.Entities.EntityRecord
        {
            Id = Guid.NewGuid(),
            EntityType = command.EntityType,
            JsonData = JsonSerializer.Serialize(command.Data),
            CreatedAt = DateTime.UtcNow,
            IsDraft = true,
            Version = 1,
            PortfolioId = portfolioId
        };

        await _uow.EntityRecords.AddAsync(record);
        await _uow.SaveChangesAsync();

        return record.Id;
    }
}
