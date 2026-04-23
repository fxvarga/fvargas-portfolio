namespace TinyToes.Api.Services;

/// <summary>
/// Sends transactional emails for print book orders via Microsoft Graph API.
/// Delegates to GraphEmailService.SendGenericEmailAsync for actual delivery.
/// </summary>
public class OrderEmailService
{
    private readonly GraphEmailService _graphEmail;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrderEmailService> _logger;

    public OrderEmailService(
        GraphEmailService graphEmail,
        IConfiguration configuration,
        ILogger<OrderEmailService> logger)
    {
        _graphEmail = graphEmail;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendOrderConfirmationEmailAsync(
        string email, string productName, string statusToken)
    {
        var statusUrl = BuildStatusUrl(statusToken);
        var subject = $"Your {productName} Order is Confirmed!";
        var html = BuildOrderConfirmationEmail(productName, statusUrl);
        await SendSafeAsync(email, subject, html);
    }

    public async Task SendOrderInProductionEmailAsync(
        string email, string productSlug, string? statusUrl)
    {
        var subject = "Your Book is Being Printed!";
        var html = BuildStatusUpdateEmail(
            "Your Book is Being Printed",
            "Great news! Your memory book has entered production. Our printing partner is carefully crafting your keepsake.",
            statusUrl);
        await SendSafeAsync(email, subject, html);
    }

    public async Task SendOrderShippedEmailAsync(
        string email, string productSlug, string? trackingUrlsJson, string? statusUrl)
    {
        var trackingHtml = "";
        if (!string.IsNullOrEmpty(trackingUrlsJson))
        {
            try
            {
                var urls = System.Text.Json.JsonSerializer.Deserialize<List<string>>(trackingUrlsJson);
                if (urls?.Count > 0)
                    trackingHtml = $"""<p style="margin:16px 0 0; font-size:14px;"><a href="{urls[0]}" style="color:#26C6B5; font-weight:600;">Track Your Package</a></p>""";
            }
            catch { /* ignore parse errors */ }
        }

        var subject = "Your Book Has Shipped!";
        var html = BuildStatusUpdateEmail(
            "Your Book Has Shipped",
            $"Your memory book is on its way! You'll receive it soon.{trackingHtml}",
            statusUrl);
        await SendSafeAsync(email, subject, html);
    }

    public async Task SendOrderDeliveredEmailAsync(
        string email, string productSlug, string? statusUrl)
    {
        var subject = "Your Book Has Been Delivered!";
        var html = BuildStatusUpdateEmail(
            "Your Book Has Arrived",
            "Your memory book has been delivered! We hope it brings you and your family joy for years to come.",
            statusUrl);
        await SendSafeAsync(email, subject, html);
    }

    public async Task SendMagicLinkEmailAsync(string email, string statusToken)
    {
        var statusUrl = BuildStatusUrl(statusToken);
        var subject = "Your Order Status Link";
        var html = BuildStatusUpdateEmail(
            "Here's Your Order Status Link",
            "Use the button below to check the status of your print book order.",
            statusUrl);
        await SendSafeAsync(email, subject, html);
    }

    private string BuildStatusUrl(string token)
    {
        var frontendUrl = _configuration["FRONTEND_ORIGIN"]
            ?? _configuration["Cors:AllowedOrigins"]?.Split(',')[0]
            ?? "https://tinytoes.fernando-vargas.com";
        return $"{frontendUrl.TrimEnd('/')}/print-order/{token}";
    }

    private async Task SendSafeAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            await _graphEmail.SendGenericEmailAsync(toEmail, subject, htmlBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send order email to {Email}: {Subject}", toEmail, subject);
        }
    }

    #region Email Templates

    private static string BuildOrderConfirmationEmail(string productName, string statusUrl)
    {
        return $$"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0; padding:0; background-color:#F3F6FB; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F3F6FB; padding:40px 16px;">
            <tr><td align="center">
              <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <tr><td style="background-color:#26C6B5; padding:32px 24px; text-align:center;">
                  <h1 style="margin:0; color:#FFFFFF; font-size:22px; font-weight:700;">TinyToesAndUs</h1>
                  <p style="margin:4px 0 0; color:rgba(255,255,255,0.9); font-size:14px;">Print Book Order</p>
                </td></tr>
                <tr><td style="padding:32px 24px;">
                  <h2 style="margin:0 0 16px; font-size:20px; color:#1F2937;">Order Confirmed!</h2>
                  <p style="margin:0 0 24px; font-size:16px; color:#1F2937; line-height:1.5;">
                    Thank you for your order! Your <strong>{{productName}}</strong> is being prepared for printing.
                    We'll email you when it enters production and again when it ships.
                  </p>
                  <p style="margin:0 0 8px; font-size:14px; color:#6B7280;">Your order also includes lifetime access to the full TinyToesAndUs digital bundle.</p>
                  <div style="text-align:center; margin:24px 0;">
                    <a href="{{statusUrl}}" style="display:inline-block; background-color:#26C6B5; color:#FFFFFF; text-decoration:none; font-weight:600; font-size:16px; padding:14px 32px; border-radius:12px;">
                      Track Your Order
                    </a>
                  </div>
                  <p style="margin:0; font-size:12px; color:#9CA3AF;">Save this email — the link above is your personal order status page.</p>
                </td></tr>
                <tr><td style="padding:16px 24px; border-top:1px solid #E5E7EB; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#9CA3AF;">&copy; {{DateTime.UtcNow.Year}} TinyToesAndUs</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
    }

    private static string BuildStatusUpdateEmail(string heading, string bodyText, string? statusUrl)
    {
        var ctaHtml = statusUrl is not null
            ? $$"""
              <div style="text-align:center; margin:24px 0;">
                <a href="{{statusUrl}}" style="display:inline-block; background-color:#26C6B5; color:#FFFFFF; text-decoration:none; font-weight:600; font-size:16px; padding:14px 32px; border-radius:12px;">
                  View Order Status
                </a>
              </div>
              """
            : "";

        return $$"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
        <body style="margin:0; padding:0; background-color:#F3F6FB; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F3F6FB; padding:40px 16px;">
            <tr><td align="center">
              <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <tr><td style="background-color:#26C6B5; padding:32px 24px; text-align:center;">
                  <h1 style="margin:0; color:#FFFFFF; font-size:22px; font-weight:700;">TinyToesAndUs</h1>
                </td></tr>
                <tr><td style="padding:32px 24px;">
                  <h2 style="margin:0 0 16px; font-size:20px; color:#1F2937;">{{heading}}</h2>
                  <p style="margin:0 0 24px; font-size:16px; color:#1F2937; line-height:1.5;">{{bodyText}}</p>
                  {{ctaHtml}}
                </td></tr>
                <tr><td style="padding:16px 24px; border-top:1px solid #E5E7EB; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#9CA3AF;">&copy; {{DateTime.UtcNow.Year}} TinyToesAndUs</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
    }

    #endregion
}
