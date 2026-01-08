using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using AgentChat.Infrastructure.Configuration;

namespace AgentChat.ModelGateway.LlmClients;

/// <summary>
/// Factory that provides the appropriate LLM client based on configuration.
/// Priority: Azure OpenAI (if configured) > OpenAI-Compatible (if enabled)
/// </summary>
public class LlmClientFactory
{
    private readonly AzureOpenAiLlmClient _azureClient;
    private readonly OpenAiCompatibleLlmClient _compatibleClient;
    private readonly ILogger<LlmClientFactory> _logger;

    public LlmClientFactory(
        AzureOpenAiLlmClient azureClient,
        OpenAiCompatibleLlmClient compatibleClient,
        ILogger<LlmClientFactory> logger)
    {
        _azureClient = azureClient;
        _compatibleClient = compatibleClient;
        _logger = logger;
    }

    /// <summary>
    /// Get the configured LLM client
    /// </summary>
    public ILlmClient GetClient()
    {
        // Try Azure OpenAI first
        if (_azureClient.IsConfigured)
        {
            _logger.LogDebug("Using Azure OpenAI client");
            return _azureClient;
        }

        // Fall back to OpenAI-compatible
        if (_compatibleClient.IsConfigured)
        {
            _logger.LogDebug("Using OpenAI-compatible client");
            return _compatibleClient;
        }

        // No client configured
        throw new InvalidOperationException(
            "No LLM provider configured. Please configure either Azure OpenAI " +
            "(AzureOpenAi__Endpoint, AzureOpenAi__ApiKey) or an OpenAI-compatible " +
            "provider (OpenAiCompatible__BaseUrl, OpenAiCompatible__Enabled=true).");
    }

    /// <summary>
    /// Check if any LLM provider is configured
    /// </summary>
    public bool HasConfiguredClient => _azureClient.IsConfigured || _compatibleClient.IsConfigured;

    /// <summary>
    /// Get configuration status for diagnostics
    /// </summary>
    public string GetConfigurationStatus()
    {
        var status = new System.Text.StringBuilder();
        status.AppendLine("LLM Provider Configuration:");
        status.AppendLine($"  Azure OpenAI: {(_azureClient.IsConfigured ? "Configured" : "Not configured")}");
        status.AppendLine($"  OpenAI-Compatible: {(_compatibleClient.IsConfigured ? "Configured" : "Not configured")}");
        
        if (HasConfiguredClient)
        {
            var client = GetClient();
            status.AppendLine($"  Active Provider: {client.ProviderName}");
        }
        
        return status.ToString();
    }
}
