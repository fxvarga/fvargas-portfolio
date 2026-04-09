namespace TinyToes.Api.Services;

/// <summary>
/// Sends emails via Microsoft Graph API using the client_credentials OAuth2 flow.
/// Uses the same Azure AD app registration as the rest of the portfolio.
/// </summary>
public class GraphEmailService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GraphEmailService> _logger;

    private string? _cachedToken;
    private DateTimeOffset _tokenExpiry = DateTimeOffset.MinValue;

    public GraphEmailService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GraphEmailService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured =>
        !string.IsNullOrEmpty(_configuration["MS_GRAPH_TENANT_ID"]) &&
        !string.IsNullOrEmpty(_configuration["MS_GRAPH_CLIENT_ID"]) &&
        !string.IsNullOrEmpty(_configuration["MS_GRAPH_CLIENT_SECRET"]) &&
        !string.IsNullOrEmpty(_configuration["MAIL_USER_UPN"]);

    public async Task SendClaimCodeEmailAsync(
        string recipientEmail,
        string recipientName,
        string claimCode,
        string appUrl,
        string productName = "Baby First Bites")
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("Graph API not configured — skipping email delivery for {Email}", recipientEmail);
            return;
        }

        var subject = $"Your {productName} is Ready!";
        var htmlBody = BuildClaimCodeEmail(recipientName, claimCode, appUrl, productName);

        await SendEmailAsync(recipientEmail, recipientName, subject, htmlBody);
    }

    private async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var token = await GetAccessTokenAsync();
        var upn = _configuration["MAIL_USER_UPN"]!;

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            message = new
            {
                subject,
                body = new
                {
                    contentType = "HTML",
                    content = htmlBody
                },
                toRecipients = new[]
                {
                    new
                    {
                        emailAddress = new
                        {
                            address = toEmail,
                            name = string.IsNullOrWhiteSpace(toName) ? toEmail : toName
                        }
                    }
                }
            },
            saveToSentItems = false
        };

        var response = await client.PostAsJsonAsync(
            $"https://graph.microsoft.com/v1.0/users/{upn}/sendMail",
            payload);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Graph sendMail failed ({Status}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException($"Graph sendMail failed: {response.StatusCode}");
        }

        _logger.LogInformation("Claim code email sent to {Email}", toEmail);
    }

    private async Task<string> GetAccessTokenAsync()
    {
        // Return cached token if still valid (with 2 min buffer)
        if (_cachedToken is not null && _tokenExpiry > DateTimeOffset.UtcNow.AddMinutes(2))
            return _cachedToken;

        var tenantId = _configuration["MS_GRAPH_TENANT_ID"]!;
        var clientId = _configuration["MS_GRAPH_CLIENT_ID"]!;
        var clientSecret = _configuration["MS_GRAPH_CLIENT_SECRET"]!;

        var client = _httpClientFactory.CreateClient();
        var tokenUrl = $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token";

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["scope"] = "https://graph.microsoft.com/.default"
        };

        var response = await client.PostAsync(tokenUrl, new FormUrlEncodedContent(form));

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Token acquisition failed ({Status}): {Body}", response.StatusCode, body);
            throw new InvalidOperationException("Failed to acquire Graph API token.");
        }

        var result = await response.Content.ReadFromJsonAsync<TokenResponse>();
        _cachedToken = result!.AccessToken;
        _tokenExpiry = DateTimeOffset.UtcNow.AddSeconds(result.ExpiresIn);

        return _cachedToken;
    }

    private static string BuildClaimCodeEmail(string name, string claimCode, string appUrl, string productName)
    {
        var greeting = string.IsNullOrWhiteSpace(name) ? "Hi there" : $"Hi {name}";
        var claimUrl = $"{appUrl.TrimEnd('/')}/claim";

        return $$"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0; padding:0; background-color:#F3F6FB; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F3F6FB; padding:40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color:#26C6B5; padding:32px 24px; text-align:center;">
                      <div style="font-size:32px; margin-bottom:8px;">🦶</div>
                      <h1 style="margin:0; color:#FFFFFF; font-size:22px; font-weight:700;">TinyToesAndUs</h1>
                      <p style="margin:4px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">{{productName}}</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:32px 24px;">
                      <p style="margin:0 0 16px; font-size:16px; color:#1F2937;">{{greeting}},</p>
                      <p style="margin:0 0 24px; font-size:16px; color:#1F2937; line-height:1.5;">
                        Thank you for your purchase! Your <strong>{{productName}}</strong> is ready. Use the claim code below to activate it in the TinyToesAndUs app.
                      </p>
                      <!-- Claim Code Box -->
                      <div style="background-color:#D1FAF5; border-radius:12px; padding:20px; text-align:center; margin:0 0 24px;">
                        <p style="margin:0 0 8px; font-size:12px; color:#6B7280; text-transform:uppercase; letter-spacing:0.05em;">Your Claim Code</p>
                        <p style="margin:0; font-size:28px; font-weight:700; color:#1F2937; font-family:monospace; letter-spacing:0.05em;">{{claimCode}}</p>
                      </div>
                      <!-- CTA Button -->
                      <div style="text-align:center; margin:0 0 24px;">
                        <a href="{{claimUrl}}" style="display:inline-block; background-color:#26C6B5; color:#FFFFFF; text-decoration:none; font-weight:600; font-size:16px; padding:14px 32px; border-radius:12px;">
                          Activate Now
                        </a>
                      </div>
                      <p style="margin:0; font-size:14px; color:#6B7280; line-height:1.5;">
                        Open the link above, enter your email and claim code, and you'll be up and running in under two minutes.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding:16px 24px; border-top:1px solid #E5E7EB; text-align:center;">
                      <p style="margin:0; font-size:12px; color:#9CA3AF;">
                        &copy; {{DateTime.UtcNow.Year}} TinyToesAndUs
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }

    private class TokenResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = "";

        [System.Text.Json.Serialization.JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; } = 3600;
    }
}
