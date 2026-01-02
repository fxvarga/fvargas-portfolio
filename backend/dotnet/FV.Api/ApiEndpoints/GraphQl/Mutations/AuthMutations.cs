using FV.Infrastructure.Services;
using HotChocolate.Authorization;

namespace FV.Api.ApiEndpoints.GraphQl.Mutations;

[ExtendObjectType(OperationTypeNames.Mutation)]
public class AuthMutations
{
    /// <summary>
    /// Login with username and password to receive a JWT token
    /// </summary>
    public async Task<LoginPayload> Login(
        LoginInput input,
        [Service] IAuthService authService)
    {
        var result = await authService.LoginAsync(input.Username, input.Password);

        if (!result.Success)
        {
            return new LoginPayload
            {
                Success = false,
                ErrorMessage = result.ErrorMessage
            };
        }

        return new LoginPayload
        {
            Success = true,
            Token = result.Token,
            User = result.User != null ? new UserPayload
            {
                Id = result.User.Id,
                Username = result.User.Username,
                Role = result.User.Role
            } : null,
            Portfolios = result.Portfolios?.Select(p => new PortfolioAccessPayload
            {
                Id = p.Id,
                Slug = p.Slug,
                Name = p.Name
            }).ToList()
        };
    }

    /// <summary>
    /// Create a new admin user (protected - requires authentication)
    /// </summary>
    [Authorize(Roles = new[] { "Admin" })]
    public async Task<CreateUserPayload> CreateUser(
        CreateUserInput input,
        [Service] IAuthService authService)
    {
        try
        {
            var user = await authService.CreateUserAsync(input.Username, input.Password, input.Role ?? "Admin");

            return new CreateUserPayload
            {
                Success = true,
                User = new UserPayload
                {
                    Id = user.Id,
                    Username = user.Username,
                    Role = user.Role
                }
            };
        }
        catch (Exception ex)
        {
            return new CreateUserPayload
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }
}

// Input types
public class LoginInput
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class CreateUserInput
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
    public string? Role { get; set; }
}

// Payload types
public class LoginPayload
{
    public bool Success { get; set; }
    public string? Token { get; set; }
    public UserPayload? User { get; set; }
    public string? ErrorMessage { get; set; }
    public List<PortfolioAccessPayload>? Portfolios { get; set; }
}

public class PortfolioAccessPayload
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = default!;
    public string Name { get; set; } = default!;
}

public class UserPayload
{
    public Guid Id { get; set; }
    public string Username { get; set; } = default!;
    public string Role { get; set; } = default!;
}

public class CreateUserPayload
{
    public bool Success { get; set; }
    public UserPayload? User { get; set; }
    public string? ErrorMessage { get; set; }
}
