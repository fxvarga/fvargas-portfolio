using System.Text.Json.Serialization;
using AgentChat.ApiBff.Endpoints;
using AgentChat.ApiBff.Hubs;
using AgentChat.ApiBff.Middleware;
using AgentChat.FinanceKnowledge.Services;
using AgentChat.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddAgentChatInfrastructure(builder.Configuration);

// Register Knowledge Base Service
builder.Services.AddSingleton<IKnowledgeBaseService, KnowledgeBaseService>();

// Configure JSON serialization to use string enums
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// In development, use a simple auth bypass; in production, use JWT
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddAuthentication("DevBypass")
        .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, DevAuthHandler>(
            "DevBypass", null);
    builder.Services.AddAuthorization();
}
else
{
    builder.Services.AddAuthentication("Bearer")
        .AddJwtBearer("Bearer", options =>
        {
            options.Authority = builder.Configuration["Auth:Authority"];
            options.Audience = builder.Configuration["Auth:Audience"];
            options.RequireHttpsMetadata = true;
        });
    builder.Services.AddAuthorization();
}

builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Agent Chat API", Version = "v1" });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() 
                ?? ["http://localhost:5173", "http://localhost:5174"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Initialize Knowledge Base
var knowledgeService = app.Services.GetRequiredService<IKnowledgeBaseService>();
await knowledgeService.InitializeAsync();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();  // Must run AFTER UseAuthentication to access claims
app.UseAuthorization();

// Map endpoints
app.MapRunEndpoints();
app.MapApprovalEndpoints();
app.MapKnowledgeEndpoints();

// SignalR hub for real-time events
app.MapHub<RunEventsHub>("/hubs/runs");

app.Run();

// Development authentication handler - bypasses auth for local development
public class DevAuthHandler : Microsoft.AspNetCore.Authentication.AuthenticationHandler<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions>
{
    public DevAuthHandler(
        Microsoft.Extensions.Options.IOptionsMonitor<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions> options,
        Microsoft.Extensions.Logging.ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<Microsoft.AspNetCore.Authentication.AuthenticateResult> HandleAuthenticateAsync()
    {
        // Create a dev user identity using Fernando's portfolio ID
        var claims = new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "00000000-0000-0000-0000-000000000001"),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, "dev-user"),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, "dev@localhost"),
            new System.Security.Claims.Claim("tenant_id", "11111111-1111-1111-1111-111111111111"), // Fernando's portfolio ID
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "DevBypass");
        var principal = new System.Security.Claims.ClaimsPrincipal(identity);
        var ticket = new Microsoft.AspNetCore.Authentication.AuthenticationTicket(principal, "DevBypass");
        
        return Task.FromResult(Microsoft.AspNetCore.Authentication.AuthenticateResult.Success(ticket));
    }
}
