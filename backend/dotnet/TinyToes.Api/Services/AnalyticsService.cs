using Microsoft.ApplicationInsights;

namespace TinyToes.Api.Services;

public class AnalyticsService
{
    private readonly TelemetryClient _telemetry;

    public AnalyticsService(TelemetryClient telemetry)
    {
        _telemetry = telemetry;
    }

    public void Track(string eventName, IDictionary<string, string>? properties = null, IDictionary<string, double>? metrics = null)
    {
        _telemetry.TrackEvent(eventName, Sanitize(properties), metrics);
    }

    private static Dictionary<string, string> Sanitize(IDictionary<string, string>? properties)
    {
        var result = new Dictionary<string, string>
        {
            ["service"] = "tinytoes-api"
        };

        if (properties is null) return result;

        foreach (var (key, value) in properties)
        {
            if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(value))
            {
                result[key] = value;
            }
        }

        return result;
    }
}
