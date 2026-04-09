using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using TinyToes.Api.Endpoints;
using TinyToes.Api.Services;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Seed;

var builder = WebApplication.CreateBuilder(args);

// Database
var connectionString = builder.Configuration.GetConnectionString("TinyToes")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DATABASE_CONNECTION"]
    ?? "Host=localhost;Port=5433;Database=tinytoes;Username=tinytoes;Password=tinytoes_dev";

builder.Services.AddDbContext<TinyToesDbContext>(options =>
    options.UseNpgsql(connectionString));

// Services
builder.Services.AddScoped<ClaimService>();
builder.Services.AddSingleton<GraphEmailService>();
builder.Services.AddScoped<StripeWebhookService>();
builder.Services.AddHttpClient();

// CORS
var frontendOrigin = builder.Configuration["Cors:AllowedOrigins"]
    ?? builder.Configuration["FRONTEND_ORIGIN"]
    ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendOrigin.Split(','))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("claim", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = 429;
});

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString);

var app = builder.Build();

// Initialize database
await SeedData.InitializeAsync(app.Services);

// Middleware
app.UseCors();
app.UseRateLimiter();

// Endpoints
app.MapClaimEndpoints();
app.MapCheckoutEndpoints();
app.MapStripeEndpoints();
app.MapAdminEndpoints();
app.MapHealthChecks("/health");
app.MapHealthChecks("/healthz");

app.Run();
