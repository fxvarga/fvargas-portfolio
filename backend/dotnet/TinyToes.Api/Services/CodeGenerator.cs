using System.Security.Cryptography;

namespace TinyToes.Api.Services;

public static class CodeGenerator
{
    private static readonly char[] Chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();

    public static string Generate()
    {
        var part1 = GeneratePart(4);
        var part2 = GeneratePart(4);
        return $"TINY-{part1}-{part2}";
    }

    private static string GeneratePart(int length)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];
        for (int i = 0; i < length; i++)
            result[i] = Chars[bytes[i] % Chars.Length];
        return new string(result);
    }
}
