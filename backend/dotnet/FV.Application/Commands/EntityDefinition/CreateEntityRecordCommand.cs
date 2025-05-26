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

    public CreateEntityRecordHandler(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<Guid> HandleAsync(CreateEntityRecordCommand command)
    {
        var definition = await _uow.EntityDefinitions.GetByNameAsync(command.EntityType);
        if (definition == null)
            throw new Exception($"Entity type '{command.EntityType}' is not defined.");

        // TODO: Add schema-based validation here

        var record = new FV.Domain.Entities.EntityRecord
        {
            Id = Guid.NewGuid(),
            EntityType = command.EntityType,
            JsonData = JsonSerializer.Serialize(command.Data),
            CreatedAt = DateTime.UtcNow,
            IsDraft = true,
            Version = 1
        };

        await _uow.EntityRecords.AddAsync(record);
        await _uow.SaveChangesAsync();

        return record.Id;
    }
}
