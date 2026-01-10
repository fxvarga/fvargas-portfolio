using System.Collections.Concurrent;

namespace AgentChat.PortfolioAgent.Security;

/// <summary>
/// Rate limiter for visitor interactions
/// </summary>
public interface IRateLimiter
{
    /// <summary>
    /// Check if an action is allowed and consume a token if so
    /// </summary>
    RateLimitResult TryConsume(string key, RateLimitPolicy policy);
    
    /// <summary>
    /// Get remaining tokens for a key
    /// </summary>
    int GetRemaining(string key, RateLimitPolicy policy);
}

public record RateLimitPolicy
{
    public required int MaxRequests { get; init; }
    public required TimeSpan Window { get; init; }
    
    public static RateLimitPolicy VisitorMessages => new() { MaxRequests = 20, Window = TimeSpan.FromHours(1) };
    public static RateLimitPolicy VisitorToolCalls => new() { MaxRequests = 50, Window = TimeSpan.FromHours(1) };
    public static RateLimitPolicy VisitorSession => new() { MaxRequests = 100, Window = TimeSpan.FromHours(24) };
    public static RateLimitPolicy AutonomousDaily => new() { MaxRequests = 500, Window = TimeSpan.FromHours(24) };
}

public record RateLimitResult
{
    public bool Allowed { get; init; }
    public int Remaining { get; init; }
    public TimeSpan RetryAfter { get; init; }
    
    public static RateLimitResult Allow(int remaining) => new() { Allowed = true, Remaining = remaining };
    public static RateLimitResult Deny(TimeSpan retryAfter) => new() { Allowed = false, Remaining = 0, RetryAfter = retryAfter };
}

/// <summary>
/// In-memory sliding window rate limiter
/// </summary>
public class InMemoryRateLimiter : IRateLimiter
{
    private readonly ConcurrentDictionary<string, RateLimitBucket> _buckets = new();
    private readonly Timer _cleanupTimer;

    public InMemoryRateLimiter()
    {
        // Cleanup old buckets every 5 minutes
        _cleanupTimer = new Timer(Cleanup, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
    }

    public RateLimitResult TryConsume(string key, RateLimitPolicy policy)
    {
        var bucketKey = $"{key}:{policy.MaxRequests}:{policy.Window.TotalSeconds}";
        var now = DateTime.UtcNow;

        var bucket = _buckets.GetOrAdd(bucketKey, _ => new RateLimitBucket(policy.Window));
        
        lock (bucket)
        {
            bucket.RemoveExpired(now);
            
            if (bucket.Timestamps.Count >= policy.MaxRequests)
            {
                var oldestTimestamp = bucket.Timestamps.First();
                var retryAfter = oldestTimestamp.Add(policy.Window) - now;
                return RateLimitResult.Deny(retryAfter > TimeSpan.Zero ? retryAfter : TimeSpan.Zero);
            }

            bucket.Timestamps.Add(now);
            return RateLimitResult.Allow(policy.MaxRequests - bucket.Timestamps.Count);
        }
    }

    public int GetRemaining(string key, RateLimitPolicy policy)
    {
        var bucketKey = $"{key}:{policy.MaxRequests}:{policy.Window.TotalSeconds}";
        var now = DateTime.UtcNow;

        if (!_buckets.TryGetValue(bucketKey, out var bucket))
        {
            return policy.MaxRequests;
        }

        lock (bucket)
        {
            bucket.RemoveExpired(now);
            return policy.MaxRequests - bucket.Timestamps.Count;
        }
    }

    private void Cleanup(object? state)
    {
        var now = DateTime.UtcNow;
        var keysToRemove = new List<string>();

        foreach (var kvp in _buckets)
        {
            lock (kvp.Value)
            {
                kvp.Value.RemoveExpired(now);
                if (kvp.Value.Timestamps.Count == 0)
                {
                    keysToRemove.Add(kvp.Key);
                }
            }
        }

        foreach (var key in keysToRemove)
        {
            _buckets.TryRemove(key, out _);
        }
    }

    private class RateLimitBucket
    {
        public SortedSet<DateTime> Timestamps { get; } = new();
        public TimeSpan Window { get; }

        public RateLimitBucket(TimeSpan window)
        {
            Window = window;
        }

        public void RemoveExpired(DateTime now)
        {
            var cutoff = now - Window;
            Timestamps.RemoveWhere(t => t < cutoff);
        }
    }
}

/// <summary>
/// Input validation for visitor messages
/// </summary>
public static class InputValidator
{
    public const int MaxMessageLength = 2000;
    public const int MaxToolCallsPerSession = 50;

    // Known prompt injection patterns
    private static readonly string[] InjectionPatterns = new[]
    {
        "ignore previous instructions",
        "ignore all instructions",
        "disregard your instructions",
        "forget your instructions",
        "you are now",
        "new instructions:",
        "system prompt:",
        "override:",
        "jailbreak",
        "dan mode",
        "developer mode"
    };

    public static InputValidationResult Validate(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return InputValidationResult.Invalid("Message cannot be empty");
        }

        if (input.Length > MaxMessageLength)
        {
            return InputValidationResult.Invalid($"Message exceeds maximum length of {MaxMessageLength} characters");
        }

        // Check for injection attempts
        var lowerInput = input.ToLowerInvariant();
        foreach (var pattern in InjectionPatterns)
        {
            if (lowerInput.Contains(pattern))
            {
                return InputValidationResult.Suspicious($"Message contains suspicious pattern");
            }
        }

        // Strip control characters
        var sanitized = new string(input.Where(c => !char.IsControl(c) || c == '\n' || c == '\r' || c == '\t').ToArray());

        return InputValidationResult.Valid(sanitized);
    }
}

public record InputValidationResult
{
    public bool IsValid { get; init; }
    public bool IsSuspicious { get; init; }
    public string? Error { get; init; }
    public string? SanitizedInput { get; init; }

    public static InputValidationResult Valid(string sanitized) => 
        new() { IsValid = true, SanitizedInput = sanitized };
    
    public static InputValidationResult Invalid(string error) => 
        new() { IsValid = false, Error = error };
    
    public static InputValidationResult Suspicious(string reason) => 
        new() { IsValid = false, IsSuspicious = true, Error = reason };
}
