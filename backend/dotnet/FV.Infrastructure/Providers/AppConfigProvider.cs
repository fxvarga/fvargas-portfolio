using System.Text.Json;
using FV.Domain.Models;
using Microsoft.Extensions.Options;
using Microsoft.FeatureManagement;

namespace FV.Infrastructure.Providers;

public class AppConfigProvider
{
    private AppConfigValues _config;
    private readonly IFeatureManager _featureManager;

    public AppConfigProvider(IOptionsSnapshot<AppConfigValues> config, IFeatureManager featureManager)
    {
        _config = config.Value;
        _featureManager = featureManager;
    }

    public async Task<AppConfigValues> GetFeatureFlags()
    {
        // var featureFlagNames = _featureManager.GetFeatureNamesAsync();
        // var featureFlags = new Dictionary<string, bool>();

        // await foreach (var flag in featureFlagNames)
        // {
        //     featureFlags[flag] = await _featureManager.IsEnabledAsync(flag);
        // }
        var featureFlags = new Dictionary<string, bool>
        {
            { "Search", true }
        };
        _config.Flags = JsonSerializer.Serialize(featureFlags);

        return await Task.FromResult(_config);
    }
}
