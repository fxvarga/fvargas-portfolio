using System.Collections.Concurrent;
using AgentChat.ApiBff.Configuration;
using Microsoft.Extensions.Options;

namespace AgentChat.ApiBff.Services;

public interface IAudioStorageService
{
    Task<string> SaveAsync(byte[] content, string contentType, Guid tenantId, Guid userId, CancellationToken cancellationToken = default);
    Task<StoredAudio?> GetAsync(string id, Guid tenantId, Guid userId, CancellationToken cancellationToken = default);
}

public sealed record StoredAudio(string Id, string ContentType, byte[] Content, DateTimeOffset ExpiresAt);

public class AudioStorageService : IAudioStorageService
{
    private readonly VoiceOptions _options;
    private readonly ConcurrentDictionary<string, StoredAudioMetadata> _index = new();

    public AudioStorageService(IOptions<VoiceOptions> options)
    {
        _options = options.Value;
        Directory.CreateDirectory(_options.StoragePath);
    }

    public async Task<string> SaveAsync(byte[] content, string contentType, Guid tenantId, Guid userId, CancellationToken cancellationToken = default)
    {
        CleanupExpired();

        var id = Guid.NewGuid().ToString("N");
        var filePath = Path.Combine(_options.StoragePath, $"{id}.bin");
        var expiresAt = DateTimeOffset.UtcNow.AddHours(_options.RetentionHours);

        await File.WriteAllBytesAsync(filePath, content, cancellationToken);

        _index[id] = new StoredAudioMetadata
        {
            Id = id,
            TenantId = tenantId,
            UserId = userId,
            FilePath = filePath,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
            ExpiresAt = expiresAt
        };

        return id;
    }

    public async Task<StoredAudio?> GetAsync(string id, Guid tenantId, Guid userId, CancellationToken cancellationToken = default)
    {
        CleanupExpired();

        if (!_index.TryGetValue(id, out var metadata))
            return null;

        if (metadata.TenantId != tenantId || metadata.UserId != userId)
            return null;

        if (!File.Exists(metadata.FilePath))
        {
            _index.TryRemove(id, out _);
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(metadata.FilePath, cancellationToken);
        return new StoredAudio(id, metadata.ContentType, bytes, metadata.ExpiresAt);
    }

    private void CleanupExpired()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var item in _index)
        {
            if (item.Value.ExpiresAt > now)
                continue;

            _index.TryRemove(item.Key, out var removed);
            if (removed is not null && File.Exists(removed.FilePath))
            {
                File.Delete(removed.FilePath);
            }
        }
    }

    private sealed class StoredAudioMetadata
    {
        public required string Id { get; init; }
        public required string FilePath { get; init; }
        public required string ContentType { get; init; }
        public required Guid TenantId { get; init; }
        public required Guid UserId { get; init; }
        public required DateTimeOffset ExpiresAt { get; init; }
    }
}
