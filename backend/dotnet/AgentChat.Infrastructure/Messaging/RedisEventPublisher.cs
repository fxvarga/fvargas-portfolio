using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using AgentChat.Infrastructure.Configuration;
using AgentChat.Shared.Contracts;

namespace AgentChat.Infrastructure.Messaging;

/// <summary>
/// Redis-based pub/sub for real-time event streaming
/// </summary>
public class RedisEventPublisher : IEventPublisher, IEventSubscriber, IAsyncDisposable
{
    private readonly IConnectionMultiplexer _redis;
    private readonly RedisOptions _options;
    private readonly ILogger<RedisEventPublisher> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public RedisEventPublisher(
        IConnectionMultiplexer redis,
        IOptions<RedisOptions> options,
        ILogger<RedisEventPublisher> logger)
    {
        _redis = redis;
        _options = options.Value;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    private string GetChannelName(Guid runId) => $"{_options.InstanceName}run:{runId}";

    public async Task PublishEventAsync(Guid runId, object evt, CancellationToken cancellationToken = default)
    {
        try
        {
            var channel = GetChannelName(runId);
            var subscriber = _redis.GetSubscriber();
            var message = JsonSerializer.Serialize(evt, evt.GetType(), _jsonOptions);
            
            await subscriber.PublishAsync(RedisChannel.Literal(channel), message);
            
            _logger.LogDebug("Published event to channel {Channel}", channel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event to Redis for run {RunId}", runId);
            throw;
        }
    }

    public async Task PublishEventsAsync(Guid runId, IReadOnlyList<object> events, CancellationToken cancellationToken = default)
    {
        if (events.Count == 0) return;

        try
        {
            var channel = GetChannelName(runId);
            var subscriber = _redis.GetSubscriber();

            foreach (var evt in events)
            {
                var message = JsonSerializer.Serialize(evt, evt.GetType(), _jsonOptions);
                await subscriber.PublishAsync(RedisChannel.Literal(channel), message);
            }

            _logger.LogDebug("Published {Count} events to channel {Channel}", events.Count, channel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish events to Redis for run {RunId}", runId);
            throw;
        }
    }

    public async IAsyncEnumerable<object> SubscribeAsync(
        Guid runId,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var channel = GetChannelName(runId);
        var subscriber = _redis.GetSubscriber();
        var queue = System.Threading.Channels.Channel.CreateUnbounded<string>();

        var subscription = await subscriber.SubscribeAsync(RedisChannel.Literal(channel));
        subscription.OnMessage(message =>
        {
            if (message.Message.HasValue)
            {
                queue.Writer.TryWrite(message.Message!);
            }
        });

        try
        {
            await foreach (var message in queue.Reader.ReadAllAsync(cancellationToken))
            {
                var evt = JsonSerializer.Deserialize<object>(message, _jsonOptions);
                if (evt != null)
                {
                    yield return evt;
                }
            }
        }
        finally
        {
            await subscription.UnsubscribeAsync();
        }
    }

    public async IAsyncEnumerable<(Guid RunId, object Event)> SubscribeManyAsync(
        IReadOnlyList<Guid> runIds,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var subscriber = _redis.GetSubscriber();
        var queue = System.Threading.Channels.Channel.CreateUnbounded<(Guid, string)>();
        var subscriptions = new List<ChannelMessageQueue>();

        foreach (var runId in runIds)
        {
            var channel = GetChannelName(runId);
            var subscription = await subscriber.SubscribeAsync(RedisChannel.Literal(channel));
            var capturedRunId = runId;
            subscription.OnMessage(message =>
            {
                if (message.Message.HasValue)
                {
                    queue.Writer.TryWrite((capturedRunId, message.Message!));
                }
            });
            subscriptions.Add(subscription);
        }

        try
        {
            await foreach (var (runId, message) in queue.Reader.ReadAllAsync(cancellationToken))
            {
                var evt = JsonSerializer.Deserialize<object>(message, _jsonOptions);
                if (evt != null)
                {
                    yield return (runId, evt);
                }
            }
        }
        finally
        {
            foreach (var subscription in subscriptions)
            {
                await subscription.UnsubscribeAsync();
            }
        }
    }

    public ValueTask DisposeAsync()
    {
        // Redis multiplexer is managed by DI container
        return ValueTask.CompletedTask;
    }
}
