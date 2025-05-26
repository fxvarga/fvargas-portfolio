using Azure.Identity;

namespace FV.Api.Providers;

public class AzureConfigProvider
{
    public static void AddAzureConfig(ConfigurationManager config)
    {

        var appConfigEndpoint = new Uri(config["AppConfig:Endpoint"]);

        config.AddAzureAppConfiguration(options =>
        {
            options.Connect(appConfigEndpoint, new ManagedIdentityCredential(config["UserManagedIdentityClientId"]))
                        .ConfigureRefresh(refresh =>
                    {
                        refresh.Register("AppConfigValues:OutageBannerMessage", refreshAll: true)
                            .SetRefreshInterval(TimeSpan.FromMinutes(double.Parse(config["AppConfig:RefreshIntervalMinutes"])));
                        refresh.Register("AppConfigValues:CurrentUiVersion", refreshAll: true)
                            .SetRefreshInterval(TimeSpan.FromMinutes(double.Parse(config["AppConfig:RefreshIntervalMinutes"])));
                    }).UseFeatureFlags(options =>
                    {
                        options.SetRefreshInterval(TimeSpan.FromMinutes(double.Parse(config["AppConfig:RefreshIntervalMinutes"])));
                    });
        });
    }
}
