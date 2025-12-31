using FV.Api.Providers;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.FeatureManagement;
using FV.Api.Configurations;
using FV.Application;
using FV.Infrastructure;
using FV.Infrastructure.Extensions;
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
var cmsDbPath = System.IO.Path.Combine(builder.Environment.ContentRootPath, "cms.db");
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

// Add Auth Service and Database Seeder
services.AddScoped<IAuthService, AuthService>();
services.AddScoped<IDatabaseSeeder, DatabaseSeeder>();

// Add services to the container.
services.AddPersistentChatStore();
services.AddHttpContextAccessor();
services.AddAzureAppConfiguration();
services.AddFeatureManagement();
services.AddGraphQlServices(config);
services.AddHealthChecks();
services.AddOpenTelemetryConfiguration(config);
services.AddApplicationServices();
services.AddInfrastructureServices();

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

// Ensure database is created and seed data
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CmsDbContext>();
    dbContext.Database.EnsureCreated();
    
    // Seed database with initial data
    var seeder = scope.ServiceProvider.GetRequiredService<IDatabaseSeeder>();
    await seeder.SeedAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapBananaCakePop();
}
else
{
    app.UseHsts();
}
app.UseCors();
app.UseHttpsRedirection();
app.UseRouting();

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/healthcheck", new HealthCheckOptions() { Predicate = (check) => !check.Tags.Contains("HealthCheck") });
app.MapGraphQL();
app.UseWebSockets();
await app.RunAsync();
