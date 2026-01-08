namespace AgentChat.Infrastructure.Configuration;

/// <summary>
/// Configuration for PostgreSQL database connection
/// </summary>
public class DatabaseOptions
{
    public const string SectionName = "Database";
    
    public string ConnectionString { get; set; } = string.Empty;
    public int MaxRetryCount { get; set; } = 3;
    public int CommandTimeout { get; set; } = 30;
    public bool EnableSensitiveDataLogging { get; set; } = false;
}

/// <summary>
/// Configuration for RabbitMQ connection
/// </summary>
public class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";
    
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";
    public int PrefetchCount { get; set; } = 10;
    public bool AutomaticRecoveryEnabled { get; set; } = true;
    public TimeSpan NetworkRecoveryInterval { get; set; } = TimeSpan.FromSeconds(10);
}

/// <summary>
/// Configuration for Redis connection
/// </summary>
public class RedisOptions
{
    public const string SectionName = "Redis";
    
    public string ConnectionString { get; set; } = "localhost:6379";
    public int Database { get; set; } = 0;
    public string InstanceName { get; set; } = "agent-chat:";
    public int ConnectTimeout { get; set; } = 5000;
    public int SyncTimeout { get; set; } = 5000;
}

/// <summary>
/// Configuration for Azure OpenAI
/// </summary>
public class AzureOpenAiOptions
{
    public const string SectionName = "AzureOpenAi";
    
    public string Endpoint { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string DefaultDeployment { get; set; } = "gpt-4o";
    public string ApiVersion { get; set; } = "2024-08-01-preview";
    public int MaxRetries { get; set; } = 3;
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(2);
}

/// <summary>
/// Configuration for OpenAI-compatible providers (Ollama, OpenRouter, local LLMs, etc.)
/// </summary>
public class OpenAiCompatibleOptions
{
    public const string SectionName = "OpenAiCompatible";
    
    /// <summary>
    /// Base URL for the OpenAI-compatible API (e.g., http://localhost:11434/v1 for Ollama)
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;
    
    /// <summary>
    /// API key (optional for local providers like Ollama)
    /// </summary>
    public string? ApiKey { get; set; }
    
    /// <summary>
    /// Default model to use (e.g., llama3.2, mistral, etc.)
    /// </summary>
    public string DefaultModel { get; set; } = "llama3.2";
    
    /// <summary>
    /// Whether to enable this provider as a fallback when Azure OpenAI is not configured
    /// </summary>
    public bool Enabled { get; set; } = false;
}

/// <summary>
/// Configuration for OpenTelemetry
/// </summary>
public class TelemetryOptions
{
    public const string SectionName = "Telemetry";
    
    public string ServiceName { get; set; } = "agent-chat";
    public string OtlpEndpoint { get; set; } = string.Empty;
    public bool EnableConsoleExporter { get; set; } = false;
    public double SamplingRatio { get; set; } = 1.0;
}
