using System.Text.Json;
using FV.Domain.Entities;
using FV.Domain.Interfaces;

namespace FV.Infrastructure.Persistence.FileStorage;

public class FileEntityRecordRepository : IEntityRecordRepository
{
    private readonly string _baseDir = Path.Combine("data", "records");

    public async Task AddAsync(EntityRecord entity)
    {
        var dir = Path.Combine(_baseDir, entity.EntityType);
        Directory.CreateDirectory(dir);

        var filePath = Path.Combine(dir, $"{entity.Id}.json");
        var json = JsonSerializer.Serialize(entity, new JsonSerializerOptions { WriteIndented = true });

        await File.WriteAllTextAsync(filePath, json);
    }

    public async Task<List<EntityRecord>> GetAllAsync()
    {
        if (!Directory.Exists(_baseDir))
            return [];

        var allFiles = Directory.EnumerateFiles(_baseDir, "*.json", SearchOption.AllDirectories);
        var records = new List<EntityRecord>();

        foreach (var file in allFiles)
        {
            var json = await File.ReadAllTextAsync(file);
            var record = JsonSerializer.Deserialize<EntityRecord>(json);
            if (record is not null)
                records.Add(record);
        }

        return records;
    }

    public async Task<EntityRecord?> GetByIdAsync(Guid id)
    {
        var all = await GetAllAsync();
        return all.FirstOrDefault(r => r.Id == id);
    }

    public async Task<List<EntityRecord>> GetByEntityTypeAsync(string entityType)
    {
        var dir = Path.Combine(_baseDir, entityType);
        if (!Directory.Exists(dir))
            return [];

        var files = Directory.EnumerateFiles(dir, "*.json");
        var records = new List<EntityRecord>();

        foreach (var file in files)
        {
            var json = await File.ReadAllTextAsync(file);
            var record = JsonSerializer.Deserialize<EntityRecord>(json);
            if (record is not null)
                records.Add(record);
        }

        return records;
    }

    public void Update(EntityRecord entity)
    {
        // You can re-use AddAsync here (overwrite by ID)
        AddAsync(entity).Wait();
    }

    public void Remove(EntityRecord entity)
    {
        var dir = Path.Combine(_baseDir, entity.EntityType);
        var path = Path.Combine(dir, $"{entity.Id}.json");
        if (File.Exists(path))
            File.Delete(path);
    }
    public async Task ClearAllAsync()
    {
        if (Directory.Exists(_baseDir))
        {
            Directory.Delete(_baseDir, true);
            Directory.CreateDirectory(_baseDir);
        }
        await Task.CompletedTask;
    }

}
