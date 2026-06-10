using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace TinyToes.Api.Services;

public class ShareSecurityService
{
    private const string InviteCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private readonly byte[] _hashKey;

    public ShareSecurityService(IOptions<ShareInviteOptions> options, IHostEnvironment hostEnvironment)
    {
        var hashKey = options.Value.InviteHashKey;
        if (string.IsNullOrWhiteSpace(hashKey))
        {
            throw new InvalidOperationException("ShareInvite:InviteHashKey must be configured.");
        }

        if (!hostEnvironment.IsDevelopment() &&
            string.Equals(hashKey, "dev-only-replace-share-invite-hash-key", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("ShareInvite:InviteHashKey must be replaced outside Development.");
        }

        _hashKey = Encoding.UTF8.GetBytes(hashKey);
    }

    public string GenerateInviteCode()
    {
        var part1 = GenerateCodePart(4);
        var part2 = GenerateCodePart(4);
        return $"{part1}-{part2}";
    }

    public string GenerateOpaqueToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

    public string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public string NormalizeCode(string code) => code.Trim().ToUpperInvariant();

    public string HashCode(string normalizedCode) => HashValue($"code:{normalizedCode}");

    public string HashToken(string token) => HashValue($"token:{token}");

    public bool FixedTimeTokenEquals(string token, string expectedHash)
    {
        var tokenHash = HashToken(token);
        var a = Encoding.UTF8.GetBytes(tokenHash);
        var b = Encoding.UTF8.GetBytes(expectedHash);
        return CryptographicOperations.FixedTimeEquals(a, b);
    }

    private string GenerateCodePart(int length)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];

        for (var i = 0; i < length; i++)
        {
            result[i] = InviteCodeChars[bytes[i] % InviteCodeChars.Length];
        }

        return new string(result);
    }

    private string HashValue(string input)
    {
        using var hmac = new HMACSHA256(_hashKey);
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash);
    }
}
