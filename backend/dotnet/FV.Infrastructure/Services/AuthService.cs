using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FV.Domain.Entities;
using FV.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FV.Infrastructure.Services;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(string username, string password);
    Task<CmsUser?> GetUserByIdAsync(Guid userId);
    Task<CmsUser> CreateUserAsync(string username, string password, string role = "Admin");
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}

public class AuthResult
{
    public bool Success { get; set; }
    public string? Token { get; set; }
    public CmsUser? User { get; set; }
    public string? ErrorMessage { get; set; }
}

public class AuthService : IAuthService
{
    private readonly CmsDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(CmsDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResult> LoginAsync(string username, string password)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username && u.IsActive);

        if (user == null)
        {
            return new AuthResult { Success = false, ErrorMessage = "Invalid username or password" };
        }

        if (!VerifyPassword(password, user.PasswordHash))
        {
            return new AuthResult { Success = false, ErrorMessage = "Invalid username or password" };
        }

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return new AuthResult
        {
            Success = true,
            Token = token,
            User = user
        };
    }

    public async Task<CmsUser?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public async Task<CmsUser> CreateUserAsync(string username, string password, string role = "Admin")
    {
        var user = new CmsUser
        {
            Id = Guid.NewGuid(),
            Username = username,
            PasswordHash = HashPassword(password),
            Role = role,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    private string GenerateJwtToken(CmsUser user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
        var issuer = jwtSettings["Issuer"] ?? "FV.Api";
        var audience = jwtSettings["Audience"] ?? "FV.Portfolio";
        var expirationHours = int.Parse(jwtSettings["ExpirationHours"] ?? "24");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
