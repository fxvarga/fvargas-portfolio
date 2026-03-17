using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.FeatureManagement;
using FV.Api.Configurations;
using FV.Application;
using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure;
using FV.Infrastructure.ContentMigrations;
using FV.Infrastructure.Middleware;
using FV.Infrastructure.Persistence;
using FV.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var services = builder.Services;
var config = builder.Configuration;

var isDevelopment = builder.Environment.IsDevelopment();

// Add CMS Database (SQLite)
var cmsDbPath = Environment.GetEnvironmentVariable("CMS_DB_PATH")
    ?? System.IO.Path.Combine(builder.Environment.ContentRootPath, "cms.db");
services.AddDbContext<CmsDbContext>(options =>
    options.UseSqlite($"Data Source={cmsDbPath}"));

// Add JWT Authentication
var jwtSettings = config.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";

services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "FV.Api",
        ValidAudience = jwtSettings["Audience"] ?? "FV.Portfolio",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

services.AddAuthorization();

// Add Auth Service and Content Migration Runner
services.AddScoped<IAuthService, AuthService>();
services.AddScoped<IContentMigrationRunner, ContentMigrationRunner>();

// Add services to the container.
services.AddHttpContextAccessor();
services.AddAzureAppConfiguration();
services.AddFeatureManagement();
services.AddGraphQlServices(config);
services.AddHealthChecks();
services.AddOpenTelemetryConfiguration(config);
services.AddApplicationServices();
services.AddInfrastructureServices();
services.AddSearchServices();

// Register CORS services
services.AddCors(options =>
{
    if (isDevelopment)
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
        });
    }
    if (!isDevelopment)
    {
        options.AddDefaultPolicy(corsBuilder =>
        {
            corsBuilder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
    }
});

services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
services.AddMemoryCache();

var app = builder.Build();

// Ensure database is created and run content migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CmsDbContext>();
    dbContext.Database.EnsureCreated();

    // Run content migrations (replaces the old DatabaseSeeder)
    var migrationRunner = scope.ServiceProvider.GetRequiredService<IContentMigrationRunner>();
    var result = await migrationRunner.MigrateAsync();

    if (!result.Success)
    {
        throw new InvalidOperationException($"Content migration failed: {result.ErrorMessage}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapBananaCakePop();
    app.UseHttpsRedirection();
}
else
{
    app.UseHsts();
    // In production, Caddy handles HTTPS - use forwarded headers instead
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
            | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
    });
}
app.UseCors();
app.UseRouting();

// Tenant resolution must happen before authentication/authorization
// so that tenant context is available for the request
app.UseTenantResolution();

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/healthcheck", new HealthCheckOptions() { Predicate = (check) => !check.Tags.Contains("HealthCheck") });

// WebSockets must be enabled before MapGraphQL for subscriptions to work
app.UseWebSockets();
app.MapGraphQL();

// ---------------------------------------------------------------
// REST API: Inquiry submissions from portfolio site forms
// ---------------------------------------------------------------
app.MapPost("/api/inquiries", async (
    HttpContext httpContext,
    CmsDbContext dbContext,
    ITenantContext tenantContext,
    ILogger<Program> logger) =>
{
    InquiryRequest? request;
    try
    {
        request = await httpContext.Request.ReadFromJsonAsync<InquiryRequest>();
    }
    catch
    {
        return Results.BadRequest(new { error = "Invalid JSON payload" });
    }

    if (request is null || string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest(new { error = "firstName and email are required" });
    }

    // Resolve portfolio from tenant context (set by TenantResolutionMiddleware)
    // Fall back to looking up by source domain if tenant wasn't resolved
    Guid portfolioId;
    if (tenantContext.IsResolved && tenantContext.PortfolioId.HasValue)
    {
        portfolioId = tenantContext.PortfolioId.Value;
    }
    else if (!string.IsNullOrWhiteSpace(request.Source))
    {
        var portfolio = await dbContext.Portfolios
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Domain.ToLower() == request.Source.ToLower() && p.IsActive);
        portfolioId = portfolio?.Id ?? Guid.Empty;
    }
    else
    {
        portfolioId = Guid.Empty;
    }

    // If we still don't have a portfolio, use the first active one as fallback
    if (portfolioId == Guid.Empty)
    {
        var first = await dbContext.Portfolios
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.CreatedAt)
            .FirstOrDefaultAsync();
        portfolioId = first?.Id ?? Guid.Empty;
    }

    if (portfolioId == Guid.Empty)
    {
        logger.LogWarning("Inquiry submission could not resolve a portfolio. Source: {Source}", request.Source);
        return Results.StatusCode(500);
    }

    var inquiry = new Inquiry
    {
        Id = Guid.NewGuid(),
        PortfolioId = portfolioId,
        FirstName = request.FirstName.Trim(),
        LastName = request.LastName?.Trim() ?? "",
        Email = request.Email.Trim(),
        Phone = request.Phone?.Trim(),
        Company = request.Company?.Trim(),
        Nonprofit = request.Nonprofit?.Trim(),
        EventDate = request.EventDate?.Trim(),
        HasVenue = request.HasVenue?.Trim(),
        VenueName = request.VenueName?.Trim(),
        Budget = request.Budget?.Trim(),
        GuestCount = request.GuestCount?.Trim(),
        Source = request.Source?.Trim(),
        SubmittedAt = request.SubmittedAt,
        CreatedAt = DateTime.UtcNow,
        IsRead = false
    };

    dbContext.Inquiries.Add(inquiry);
    await dbContext.SaveChangesAsync();

    logger.LogInformation(
        "Inquiry received from {FirstName} {LastName} ({Email}) for portfolio {PortfolioId}. Source: {Source}",
        inquiry.FirstName, inquiry.LastName, inquiry.Email, inquiry.PortfolioId, inquiry.Source);

    return Results.Created($"/api/inquiries/{inquiry.Id}", new
    {
        id = inquiry.Id,
        message = "Inquiry received successfully"
    });
})
.AllowAnonymous();

await app.RunAsync();

// ---------------------------------------------------------------
// DTO for inquiry form submissions
// ---------------------------------------------------------------
public record InquiryRequest(
    string FirstName,
    string? LastName,
    string Email,
    string? Phone,
    string? Company,
    string? Nonprofit,
    string? EventDate,
    string? HasVenue,
    string? VenueName,
    string? Budget,
    string? GuestCount,
    DateTime? SubmittedAt,
    string? Source
);
