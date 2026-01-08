using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using AgentChat.Infrastructure.Configuration;
using AgentChat.Shared.Contracts;
using AgentChat.Shared.Dtos;

namespace AgentChat.Infrastructure.Messaging;

/// <summary>
/// RabbitMQ-based message queue implementation
/// </summary>
public class RabbitMqMessageQueue : IMessageQueue, IAsyncDisposable
{
    private readonly IConnection _connection;
    private readonly IChannel _channel;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqMessageQueue> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    private RabbitMqMessageQueue(
        IConnection connection,
        IChannel channel,
        RabbitMqOptions options,
        ILogger<RabbitMqMessageQueue> logger)
    {
        _connection = connection;
        _channel = channel;
        _options = options;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public static async Task<RabbitMqMessageQueue> CreateAsync(
        IOptions<RabbitMqOptions> options,
        ILogger<RabbitMqMessageQueue> logger,
        CancellationToken cancellationToken = default)
    {
        var opts = options.Value;
        var factory = new ConnectionFactory
        {
            HostName = opts.HostName,
            Port = opts.Port,
            UserName = opts.UserName,
            Password = opts.Password,
            VirtualHost = opts.VirtualHost,
            AutomaticRecoveryEnabled = opts.AutomaticRecoveryEnabled
        };

        var connection = await factory.CreateConnectionAsync(cancellationToken);
        var channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);

        // Set prefetch count
        await channel.BasicQosAsync(0, (ushort)opts.PrefetchCount, false, cancellationToken);

        // Declare exchanges and queues
        await DeclareTopologyAsync(channel, cancellationToken);

        return new RabbitMqMessageQueue(connection, channel, opts, logger);
    }

    private static async Task DeclareTopologyAsync(IChannel channel, CancellationToken cancellationToken)
    {
        // Main exchange for work distribution
        await channel.ExchangeDeclareAsync(
            exchange: "agent-chat",
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        // Dead letter exchange
        await channel.ExchangeDeclareAsync(
            exchange: "agent-chat.dlx",
            type: ExchangeType.Direct,
            durable: true,
            autoDelete: false,
            cancellationToken: cancellationToken);

        // Declare queues
        var queues = new[]
        {
            QueueNames.Orchestrator,
            QueueNames.ModelGateway,
            QueueNames.ToolExecution
        };

        foreach (var queue in queues)
        {
            var args = new Dictionary<string, object?>
            {
                ["x-dead-letter-exchange"] = "agent-chat.dlx",
                ["x-dead-letter-routing-key"] = QueueNames.DeadLetter
            };

            await channel.QueueDeclareAsync(
                queue: queue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: args,
                cancellationToken: cancellationToken);

            await channel.QueueBindAsync(
                queue: queue,
                exchange: "agent-chat",
                routingKey: queue,
                cancellationToken: cancellationToken);
        }

        // Dead letter queue
        await channel.QueueDeclareAsync(
            queue: QueueNames.DeadLetter,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: cancellationToken);

        await channel.QueueBindAsync(
            queue: QueueNames.DeadLetter,
            exchange: "agent-chat.dlx",
            routingKey: QueueNames.DeadLetter,
            cancellationToken: cancellationToken);
    }

    public async Task PublishAsync(RunWorkItem workItem, CancellationToken cancellationToken = default)
    {
        var routingKey = GetRoutingKey(workItem.WorkType);
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(workItem, _jsonOptions));

        var properties = new BasicProperties
        {
            DeliveryMode = DeliveryModes.Persistent,
            ContentType = "application/json",
            MessageId = workItem.Id.ToString(),
            CorrelationId = workItem.CorrelationId.ToString(),
            Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
            Headers = new Dictionary<string, object?>
            {
                ["run-id"] = workItem.RunId.ToString(),
                ["tenant-id"] = workItem.TenantId.ToString(),
                ["work-type"] = workItem.WorkType.ToString()
            }
        };

        await _channel.BasicPublishAsync(
            exchange: "agent-chat",
            routingKey: routingKey,
            mandatory: false,
            basicProperties: properties,
            body: body,
            cancellationToken: cancellationToken);

        _logger.LogDebug("Published work item {Id} to {Queue}", workItem.Id, routingKey);
    }

    public async Task PublishBatchAsync(IReadOnlyList<RunWorkItem> workItems, CancellationToken cancellationToken = default)
    {
        foreach (var workItem in workItems)
        {
            await PublishAsync(workItem, cancellationToken);
        }
    }

    public async Task SubscribeAsync(
        string queueName,
        Func<RunWorkItem, CancellationToken, Task<WorkItemResult>> handler,
        CancellationToken cancellationToken = default)
    {
        var consumer = new AsyncEventingBasicConsumer(_channel);

        consumer.ReceivedAsync += async (sender, ea) =>
        {
            var deliveryTag = ea.DeliveryTag;
            
            try
            {
                var body = ea.Body.ToArray();
                var workItem = JsonSerializer.Deserialize<RunWorkItem>(body, _jsonOptions);

                if (workItem == null)
                {
                    _logger.LogWarning("Received null work item, rejecting");
                    await _channel.BasicRejectAsync(deliveryTag, false, cancellationToken);
                    return;
                }

                _logger.LogDebug("Processing work item {Id} of type {Type}", workItem.Id, workItem.WorkType);

                var result = await handler(workItem, cancellationToken);

                if (result.Success)
                {
                    await _channel.BasicAckAsync(deliveryTag, false, cancellationToken);

                    // Publish follow-up work items if any
                    if (result.FollowUpWorkItems?.Count > 0)
                    {
                        await PublishBatchAsync(result.FollowUpWorkItems, cancellationToken);
                    }
                }
                else
                {
                    _logger.LogWarning("Work item {Id} failed: {Error}", workItem.Id, result.Error);
                    await _channel.BasicRejectAsync(deliveryTag, false, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message");
                await _channel.BasicRejectAsync(deliveryTag, false, cancellationToken);
            }
        };

        await _channel.BasicConsumeAsync(
            queue: queueName,
            autoAck: false,
            consumer: consumer,
            cancellationToken: cancellationToken);

        _logger.LogInformation("Subscribed to queue {Queue}", queueName);

        // Keep the subscription alive until cancelled
        try
        {
            await Task.Delay(Timeout.Infinite, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Subscription to {Queue} cancelled", queueName);
        }
    }

    public async Task AcknowledgeAsync(string deliveryTag, CancellationToken cancellationToken = default)
    {
        await _channel.BasicAckAsync(ulong.Parse(deliveryTag), false, cancellationToken);
    }

    public async Task RejectAsync(string deliveryTag, bool requeue = false, CancellationToken cancellationToken = default)
    {
        await _channel.BasicRejectAsync(ulong.Parse(deliveryTag), requeue, cancellationToken);
    }

    private static string GetRoutingKey(WorkType workType) => workType switch
    {
        WorkType.OrchestrateRun => QueueNames.Orchestrator,
        WorkType.ContinueRun => QueueNames.Orchestrator,
        WorkType.ExecuteLlmCall => QueueNames.ModelGateway,
        WorkType.ExecuteToolCall => QueueNames.ToolExecution,
        WorkType.ProcessApproval => QueueNames.Orchestrator,
        _ => throw new ArgumentException($"Unknown work type: {workType}")
    };

    public async ValueTask DisposeAsync()
    {
        await _channel.CloseAsync();
        await _connection.CloseAsync();
        _channel.Dispose();
        _connection.Dispose();
    }
}
