using System.Text.Json;
using FV.Domain.Entities;
using FV.Domain.Interfaces;

namespace FV.Infrastructure.Persistence.FileStorage;

public class FileEntityDefinitionRepository : IEntityDefinitionRepository
{
    private readonly string _filePath = Path.Combine("data", "definitions.json");
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private List<EntityDefinition> _cache = new();

    public FileEntityDefinitionRepository()
    {
        Load();
    }

    private void Load()
    {
        if (!File.Exists(_filePath))
        {
            _cache = new List<EntityDefinition>();
            return;
        }

        var json = File.ReadAllText(_filePath);
        _cache = JsonSerializer.Deserialize<List<EntityDefinition>>(json, _jsonOptions) ?? new();
    }

    private void Save()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_filePath)!);
        var json = JsonSerializer.Serialize(_cache, _jsonOptions);
        File.WriteAllText(_filePath, json);
    }

    public async Task<EntityDefinition?> GetByIdAsync(Guid id)
    {
        var result = _cache.FirstOrDefault(e => e.Id == id);
        return await Task.FromResult(result);
    }

    public async Task<List<EntityDefinition>> GetAllAsync()
    {
        return await Task.FromResult(_cache.ToList());
    }

    public async Task AddAsync(EntityDefinition entity)
    {
        if (_cache.Any(e => e.Id == entity.Id))
            throw new InvalidOperationException($"EntityDefinition with Id {entity.Id} already exists.");

        _cache.Add(entity);
        Save();
        await Task.CompletedTask;
    }

    public void Update(EntityDefinition entity)
    {
        var index = _cache.FindIndex(e => e.Id == entity.Id);
        if (index == -1)
            throw new KeyNotFoundException($"EntityDefinition with Id {entity.Id} not found.");

        _cache[index] = entity;
        Save();
    }

    public void Remove(EntityDefinition entity)
    {
        var removed = _cache.RemoveAll(e => e.Id == entity.Id);
        if (removed > 0)
        {
            Save();
        }
    }

    public async Task<EntityDefinition?> GetByNameAsync(string name)
    {
        var result = _cache.FirstOrDefault(e => e.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        return await Task.FromResult(result);
    }
}
