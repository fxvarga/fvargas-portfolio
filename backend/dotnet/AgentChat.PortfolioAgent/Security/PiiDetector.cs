using System.Text.RegularExpressions;

namespace AgentChat.PortfolioAgent.Security;

/// <summary>
/// Detects and sanitizes potentially sensitive information before storage
/// </summary>
public interface IPiiDetector
{
    /// <summary>
    /// Check if text contains sensitive information
    /// </summary>
    PiiDetectionResult Detect(string text);
    
    /// <summary>
    /// Redact sensitive information from text
    /// </summary>
    string Redact(string text);
}

public class PiiDetectionResult
{
    public bool ContainsPii { get; init; }
    public IReadOnlyList<PiiMatch> Matches { get; init; } = Array.Empty<PiiMatch>();
    public bool ShouldBlock => Matches.Any(m => m.Category == PiiCategory.Credential);
}

public record PiiMatch
{
    public required PiiCategory Category { get; init; }
    public required string Pattern { get; init; }
    public required int StartIndex { get; init; }
    public required int Length { get; init; }
}

public enum PiiCategory
{
    Email,
    PhoneNumber,
    SocialSecurityNumber,
    CreditCard,
    Credential,    // API keys, passwords
    IpAddress,
    Address
}

public partial class PiiDetector : IPiiDetector
{
    private static readonly List<(PiiCategory Category, Regex Pattern, string Name)> Patterns = new()
    {
        // Email addresses
        (PiiCategory.Email, EmailPattern(), "email"),
        
        // Phone numbers (various formats)
        (PiiCategory.PhoneNumber, PhonePattern(), "phone"),
        
        // SSN (US format)
        (PiiCategory.SocialSecurityNumber, SsnPattern(), "ssn"),
        
        // Credit card numbers
        (PiiCategory.CreditCard, CreditCardPattern(), "credit_card"),
        
        // API keys / secrets (common patterns)
        (PiiCategory.Credential, ApiKeyPattern(), "api_key"),
        (PiiCategory.Credential, AwsKeyPattern(), "aws_key"),
        (PiiCategory.Credential, GenericSecretPattern(), "secret"),
        
        // IP addresses
        (PiiCategory.IpAddress, IpAddressPattern(), "ip_address")
    };

    public PiiDetectionResult Detect(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return new PiiDetectionResult { ContainsPii = false };
        }

        var matches = new List<PiiMatch>();

        foreach (var (category, pattern, _) in Patterns)
        {
            foreach (Match match in pattern.Matches(text))
            {
                matches.Add(new PiiMatch
                {
                    Category = category,
                    Pattern = match.Value,
                    StartIndex = match.Index,
                    Length = match.Length
                });
            }
        }

        return new PiiDetectionResult
        {
            ContainsPii = matches.Count > 0,
            Matches = matches
        };
    }

    public string Redact(string text)
    {
        if (string.IsNullOrEmpty(text))
        {
            return text;
        }

        var result = text;

        foreach (var (category, pattern, _) in Patterns)
        {
            result = pattern.Replace(result, match =>
            {
                var label = category switch
                {
                    PiiCategory.Email => "[EMAIL_REDACTED]",
                    PiiCategory.PhoneNumber => "[PHONE_REDACTED]",
                    PiiCategory.SocialSecurityNumber => "[SSN_REDACTED]",
                    PiiCategory.CreditCard => "[CC_REDACTED]",
                    PiiCategory.Credential => "[CREDENTIAL_REDACTED]",
                    PiiCategory.IpAddress => "[IP_REDACTED]",
                    PiiCategory.Address => "[ADDRESS_REDACTED]",
                    _ => "[REDACTED]"
                };
                return label;
            });
        }

        return result;
    }

    // Regex patterns using source generators for performance
    [GeneratedRegex(@"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")]
    private static partial Regex EmailPattern();

    [GeneratedRegex(@"(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")]
    private static partial Regex PhonePattern();

    [GeneratedRegex(@"\b\d{3}-\d{2}-\d{4}\b")]
    private static partial Regex SsnPattern();

    [GeneratedRegex(@"\b(?:\d{4}[-\s]?){3}\d{4}\b")]
    private static partial Regex CreditCardPattern();

    [GeneratedRegex(@"(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token)[=:\s]+['""]?[\w\-]{20,}['""]?", RegexOptions.IgnoreCase)]
    private static partial Regex ApiKeyPattern();

    [GeneratedRegex(@"(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}")]
    private static partial Regex AwsKeyPattern();

    [GeneratedRegex(@"(?:password|secret|passwd|pwd)[=:\s]+['""]?[^\s'""]{8,}['""]?", RegexOptions.IgnoreCase)]
    private static partial Regex GenericSecretPattern();

    [GeneratedRegex(@"\b(?:\d{1,3}\.){3}\d{1,3}\b")]
    private static partial Regex IpAddressPattern();
}
