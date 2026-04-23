using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TinyToes.Api.Services;

/// <summary>
/// Client for the Lulu Print API. Handles OAuth token management and all print job operations.
/// Mirrors the GraphEmailService pattern for token caching.
/// </summary>
public class LuluApiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LuluApiClient> _logger;

    private string? _cachedToken;
    private DateTimeOffset _tokenExpiry = DateTimeOffset.MinValue;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public LuluApiClient(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<LuluApiClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured =>
        !string.IsNullOrEmpty(_configuration["LULU_CLIENT_KEY"]) &&
        !string.IsNullOrEmpty(_configuration["LULU_CLIENT_SECRET"]);

    private string BaseUrl => _configuration["LULU_API_URL"] ?? "https://api.sandbox.lulu.com";

    #region Authentication

    private async Task<string> GetAccessTokenAsync()
    {
        if (_cachedToken is not null && _tokenExpiry > DateTimeOffset.UtcNow.AddMinutes(5))
            return _cachedToken;

        var authUrl = _configuration["LULU_AUTH_URL"]
            ?? $"{BaseUrl}/auth/realms/glasstree/protocol/openid-connect/token";
        var clientKey = _configuration["LULU_CLIENT_KEY"]!;
        var clientSecret = _configuration["LULU_CLIENT_SECRET"]!;

        var client = _httpClientFactory.CreateClient();

        // Lulu uses HTTP Basic auth with client_key:client_secret for token endpoint
        var credentials = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes($"{clientKey}:{clientSecret}"));
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials"
        };

        var response = await client.PostAsync(authUrl, new FormUrlEncodedContent(form));

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Lulu token acquisition failed ({Status}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException("Failed to acquire Lulu API token.");
        }

        var result = await response.Content.ReadFromJsonAsync<LuluTokenResponse>();
        _cachedToken = result!.AccessToken;
        _tokenExpiry = DateTimeOffset.UtcNow.AddSeconds(result.ExpiresIn);

        _logger.LogInformation("Lulu OAuth token acquired, expires in {Seconds}s", result.ExpiresIn);
        return _cachedToken;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync()
    {
        var token = await GetAccessTokenAsync();
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return client;
    }

    #endregion

    #region Cost Calculation

    /// <summary>
    /// Calculate print + shipping cost for a given SKU, page count, and shipping destination.
    /// </summary>
    public async Task<LuluCostResponse> CalculateCostAsync(
        string podPackageId, int pageCount, string shippingLevel,
        string country = "US", string stateCode = "", string postalCode = "",
        string city = "New York", string street1 = "1 Main St", string phoneNumber = "5551234567")
    {
        var client = await CreateAuthenticatedClientAsync();

        var payload = new
        {
            line_items = new[]
            {
                new
                {
                    pod_package_id = podPackageId,
                    page_count = pageCount,
                    quantity = 1
                }
            },
            shipping_address = new
            {
                country_code = country,
                state_code = string.IsNullOrEmpty(stateCode) ? "NY" : stateCode,
                postcode = string.IsNullOrEmpty(postalCode) ? "10001" : postalCode,
                city = string.IsNullOrEmpty(city) ? "New York" : city,
                street1 = string.IsNullOrEmpty(street1) ? "1 Main St" : street1,
                phone_number = string.IsNullOrEmpty(phoneNumber) ? "5551234567" : phoneNumber
            },
            shipping_option = shippingLevel
        };

        var response = await client.PostAsJsonAsync($"{BaseUrl}/print-job-cost-calculations/", payload, JsonOptions);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Lulu cost calculation failed ({Status}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Lulu cost calculation failed: {response.StatusCode}");
        }

        return (await response.Content.ReadFromJsonAsync<LuluCostResponse>(JsonOptions))!;
    }

    #endregion

    #region Cover Dimensions

    /// <summary>
    /// Get required cover dimensions for a given SKU and page count.
    /// </summary>
    public async Task<LuluCoverDimensions> GetCoverDimensionsAsync(string podPackageId, int pageCount)
    {
        var client = await CreateAuthenticatedClientAsync();

        var payload = new
        {
            pod_package_id = podPackageId,
            interior_page_count = pageCount
        };

        var response = await client.PostAsJsonAsync($"{BaseUrl}/cover-dimensions/", payload, JsonOptions);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Lulu cover dimensions failed ({Status}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Lulu cover dimensions failed: {response.StatusCode}");
        }

        return (await response.Content.ReadFromJsonAsync<LuluCoverDimensions>(JsonOptions))!;
    }

    #endregion

    #region Print Jobs

    /// <summary>
    /// Create a print job in Lulu. The job starts in UNPAID status.
    /// </summary>
    public async Task<LuluPrintJobResponse> CreatePrintJobAsync(
        string title,
        string podPackageId,
        int pageCount,
        string interiorPdfUrl,
        string coverPdfUrl,
        LuluShippingAddress shippingAddress,
        string shippingLevel,
        string? contactEmail = null)
    {
        var client = await CreateAuthenticatedClientAsync();

        var payload = new
        {
            contact_email = contactEmail,
            external_id = $"ttoes-{Guid.NewGuid():N}",
            line_items = new[]
            {
                new
                {
                    title,
                    quantity = 1,
                    external_id = $"li-{Guid.NewGuid():N}",
                    printable_normalization = new
                    {
                        pod_package_id = podPackageId,
                        interior = new { source_url = interiorPdfUrl },
                        cover = new { source_url = coverPdfUrl }
                    }
                }
            },
            shipping_address = shippingAddress,
            shipping_level = shippingLevel
        };

        var json = System.Text.Json.JsonSerializer.Serialize(payload, JsonOptions);
        _logger.LogInformation("Lulu print job request payload: {Payload}", json);

        var response = await client.PostAsJsonAsync($"{BaseUrl}/print-jobs/", payload, JsonOptions);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Lulu create print job failed ({Status}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Lulu create print job failed: {response.StatusCode} — {body}");
        }

        return (await response.Content.ReadFromJsonAsync<LuluPrintJobResponse>(JsonOptions))!;
    }

    /// <summary>
    /// Get the current status of a print job.
    /// </summary>
    public async Task<LuluPrintJobResponse> GetPrintJobAsync(long printJobId)
    {
        var client = await CreateAuthenticatedClientAsync();
        var response = await client.GetAsync($"{BaseUrl}/print-jobs/{printJobId}/");

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Lulu get print job failed ({Status}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Lulu get print job failed: {response.StatusCode}");
        }

        return (await response.Content.ReadFromJsonAsync<LuluPrintJobResponse>(JsonOptions))!;
    }

    /// <summary>
    /// Cancel a print job (only works if status is CREATED or UNPAID).
    /// </summary>
    public async Task CancelPrintJobAsync(long printJobId)
    {
        var client = await CreateAuthenticatedClientAsync();
        var response = await client.DeleteAsync($"{BaseUrl}/print-jobs/{printJobId}/");

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Lulu cancel print job failed ({Status}): {Body}", response.StatusCode, body);
        }
        else
        {
            _logger.LogInformation("Lulu print job {Id} canceled", printJobId);
        }
    }

    #endregion

    #region Shipping Options

    /// <summary>
    /// Get available shipping options for a destination.
    /// </summary>
    public async Task<List<LuluShippingOption>> GetShippingOptionsAsync(
        string podPackageId, int pageCount, int quantity,
        string country, string stateCode, string postalCode,
        string city = "New York", string street1 = "1 Main St", string phoneNumber = "5551234567")
    {
        var options = new List<LuluShippingOption>();
        var levels = new[] { "MAIL", "PRIORITY_MAIL", "GROUND_HD", "GROUND_BUS", "EXPEDITED", "EXPRESS" };

        foreach (var level in levels)
        {
            try
            {
                var cost = await CalculateCostAsync(podPackageId, pageCount, level, country, stateCode, postalCode, city, street1, phoneNumber);
                options.Add(new LuluShippingOption
                {
                    Level = level,
                    TotalCostInclTax = cost.TotalCostInclTax,
                    ShippingCost = cost.ShippingCost,
                    Currency = cost.Currency
                });
            }
            catch
            {
                // Some shipping levels may not be available for all destinations
            }
        }

        return options;
    }

    #endregion

    #region DTOs

    public class LuluTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = "";

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; } = 3600;
    }

    public class LuluCostResponse
    {
        [JsonPropertyName("total_cost_excl_tax")]
        public string TotalCostExclTax { get; set; } = "0.00";

        [JsonPropertyName("total_cost_incl_tax")]
        public string TotalCostInclTax { get; set; } = "0.00";

        [JsonPropertyName("total_tax")]
        public string TotalTax { get; set; } = "0.00";

        [JsonPropertyName("shipping_cost")]
        public LuluMoney ShippingCost { get; set; } = new();

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = "USD";

        [JsonPropertyName("line_item_costs")]
        public List<LuluLineItemCost> LineItemCosts { get; set; } = new();
    }

    public class LuluMoney
    {
        [JsonPropertyName("total_cost_excl_tax")]
        public string TotalCostExclTax { get; set; } = "0.00";

        [JsonPropertyName("total_cost_incl_tax")]
        public string TotalCostInclTax { get; set; } = "0.00";
    }

    public class LuluLineItemCost
    {
        [JsonPropertyName("total_cost_excl_tax")]
        public string TotalCostExclTax { get; set; } = "0.00";

        [JsonPropertyName("total_cost_incl_tax")]
        public string TotalCostInclTax { get; set; } = "0.00";
    }

    public class LuluCoverDimensions
    {
        [JsonPropertyName("width")]
        public string Width { get; set; } = "0";

        [JsonPropertyName("height")]
        public string Height { get; set; } = "0";

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "pt";

        /// <summary>Width in points (parsed from string)</summary>
        public double WidthPt => double.TryParse(Width, out var v) ? v : 0;

        /// <summary>Height in points (parsed from string)</summary>
        public double HeightPt => double.TryParse(Height, out var v) ? v : 0;
    }

    public class LuluShippingAddress
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("street1")]
        public string Street1 { get; set; } = "";

        [JsonPropertyName("street2")]
        public string? Street2 { get; set; }

        [JsonPropertyName("city")]
        public string City { get; set; } = "";

        [JsonPropertyName("state_code")]
        public string StateCode { get; set; } = "";

        [JsonPropertyName("postcode")]
        public string PostalCode { get; set; } = "";

        [JsonPropertyName("country_code")]
        public string CountryCode { get; set; } = "US";

        [JsonPropertyName("phone_number")]
        public string? PhoneNumber { get; set; }
    }

    public class LuluPrintJobResponse
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("status")]
        public LuluPrintJobStatus Status { get; set; } = new();

        [JsonPropertyName("shipping_address")]
        public LuluShippingAddress ShippingAddress { get; set; } = new();

        [JsonPropertyName("line_items")]
        public List<LuluPrintJobLineItem> LineItems { get; set; } = new();

        [JsonPropertyName("estimated_shipping_dates")]
        public LuluEstimatedShipping? EstimatedShippingDates { get; set; }
    }

    public class LuluPrintJobStatus
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("messages")]
        public List<string> Messages { get; set; } = new();
    }

    public class LuluPrintJobLineItem
    {
        [JsonPropertyName("tracking_id")]
        public string? TrackingId { get; set; }

        [JsonPropertyName("tracking_urls")]
        public List<string>? TrackingUrls { get; set; }
    }

    public class LuluEstimatedShipping
    {
        [JsonPropertyName("arrival_min")]
        public string? ArrivalMin { get; set; }

        [JsonPropertyName("arrival_max")]
        public string? ArrivalMax { get; set; }
    }

    public class LuluShippingOption
    {
        public string Level { get; set; } = "";
        public string TotalCostInclTax { get; set; } = "0.00";
        public LuluMoney ShippingCost { get; set; } = new();
        public string Currency { get; set; } = "USD";
    }

    #endregion
}
