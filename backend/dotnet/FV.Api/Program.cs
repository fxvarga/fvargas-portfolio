using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.FeatureManagement;
using FV.Api.Configurations;
using FV.Api.Services.CmsAgent;
using FV.Application;
using FV.Application.Services.CmsAgent;
using FV.Domain.Entities;
using FV.Domain.Interfaces;
using FV.Infrastructure;
using FV.Infrastructure.ContentMigrations;
using FV.Infrastructure.Middleware;
using FV.Infrastructure.Persistence;
using FV.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.SemanticKernel;
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

// Register Semantic Kernel with Azure OpenAI Chat Completion
var azureOpenAiEndpoint = !string.IsNullOrEmpty(config["AzureOpenAI:Endpoint"])
    ? config["AzureOpenAI:Endpoint"]!
    : Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT") ?? "";
var azureOpenAiApiKey = !string.IsNullOrEmpty(config["AzureOpenAI:ApiKey"])
    ? config["AzureOpenAI:ApiKey"]!
    : Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY") ?? "";
var chatDeploymentName = !string.IsNullOrEmpty(config["AzureOpenAI:ChatDeploymentName"])
    ? config["AzureOpenAI:ChatDeploymentName"]!
    : Environment.GetEnvironmentVariable("AZURE_OPENAI_CHAT_DEPLOYMENT") ?? "gpt-5.2-chat";
var chatModelId = !string.IsNullOrEmpty(config["AzureOpenAI:ChatModelId"])
    ? config["AzureOpenAI:ChatModelId"]!
    : "gpt-5.2-chat";

var useRealAgent = !string.IsNullOrEmpty(azureOpenAiEndpoint) && !string.IsNullOrEmpty(azureOpenAiApiKey);

if (useRealAgent)
{
    services.AddKernel();
    services.AddAzureOpenAIChatCompletion(
        deploymentName: chatDeploymentName,
        endpoint: azureOpenAiEndpoint,
        apiKey: azureOpenAiApiKey,
        modelId: chatModelId);

    // Register real CMS Agent service (Phase 2: LLM-powered)
    services.AddScoped<ICmsAgentService, CmsAgentService>();
}
else
{
    // Fallback to mock agent when Azure OpenAI is not configured
    services.AddScoped<ICmsAgentService, MockCmsAgentService>();
}

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
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
        logger.LogWarning("Content migration failed (non-fatal): {Error}. Failed migration: {Migration}",
            result.ErrorMessage, result.FailedMigration);
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

// Serve uploaded media files from /uploads/ path
var uploadsPath = System.IO.Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    ContentTypeProvider = new FileExtensionContentTypeProvider()
});

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

    // Fire-and-forget: notify n8n workflow of new inquiry
    _ = Task.Run(async () =>
    {
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            await http.PostAsJsonAsync("http://n8n:5678/webhook/catering-lead", new
            {
                inquiryId = inquiry.Id,
                firstName = inquiry.FirstName,
                lastName = inquiry.LastName,
                email = inquiry.Email,
                phone = inquiry.Phone,
                company = inquiry.Company,
                nonprofit = inquiry.Nonprofit,
                eventDate = inquiry.EventDate,
                hasVenue = inquiry.HasVenue,
                venueName = inquiry.VenueName,
                budget = inquiry.Budget,
                guestCount = inquiry.GuestCount,
                source = inquiry.Source,
                createdAt = inquiry.CreatedAt
            });
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to notify n8n of new inquiry {InquiryId}", inquiry.Id);
        }
    });

    return Results.Created($"/api/inquiries/{inquiry.Id}", new
    {
        id = inquiry.Id,
        message = "Inquiry received successfully"
    });
})
.AllowAnonymous();

// ---------------------------------------------------------------
// REST API: Lead submissions from consulting-style portfolio sites
// ---------------------------------------------------------------
app.MapPost("/api/leads", async (
    HttpContext httpContext,
    CmsDbContext dbContext,
    ITenantContext tenantContext,
    ILogger<Program> logger) =>
{
    LeadRequest? request;
    try
    {
        request = await httpContext.Request.ReadFromJsonAsync<LeadRequest>();
    }
    catch
    {
        return Results.BadRequest(new { error = "Invalid JSON payload" });
    }

    if (request is null || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email))
    {
        return Results.BadRequest(new { error = "fullName and email are required" });
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

    if (portfolioId == Guid.Empty)
    {
        logger.LogWarning("Lead submission could not resolve a portfolio. Source: {Source}", request.Source);
        return Results.StatusCode(500);
    }

    var lead = new Lead
    {
        Id = Guid.NewGuid(),
        PortfolioId = portfolioId,
        FullName = request.FullName.Trim(),
        Email = request.Email.Trim(),
        Company = request.Company?.Trim(),
        Industry = request.Industry?.Trim(),
        ProblemDescription = request.ProblemDescription?.Trim(),
        ServiceTier = request.ServiceTier?.Trim(),
        Source = request.Source?.Trim(),
        SubmittedAt = request.SubmittedAt,
        CreatedAt = DateTime.UtcNow,
        IsRead = false
    };

    dbContext.Leads.Add(lead);
    await dbContext.SaveChangesAsync();

    logger.LogInformation(
        "Lead received from {FullName} ({Email}) for portfolio {PortfolioId}. Industry: {Industry}, Source: {Source}",
        lead.FullName, lead.Email, lead.PortfolioId, lead.Industry, lead.Source);

    // Fire-and-forget: notify n8n workflow of new lead
    // Route to portfolio-specific webhook based on the resolved portfolio
    var webhookSlug = portfolioId switch
    {
        var id when id == ContentMigrationContext.OpsBlueprintPortfolioId => "opsblueprint-lead",
        var id when id == ContentMigrationContext.BradPortfolioId => "brad-contact",
        _ => null
    };

    if (webhookSlug is not null)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
                await http.PostAsJsonAsync($"http://n8n:5678/webhook/{webhookSlug}", new
                {
                    leadId = lead.Id,
                    fullName = lead.FullName,
                    email = lead.Email,
                    company = lead.Company,
                    industry = lead.Industry,
                    problemDescription = lead.ProblemDescription,
                    serviceTier = lead.ServiceTier,
                    source = lead.Source,
                    createdAt = lead.CreatedAt
                });
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to notify n8n of new lead {LeadId}", lead.Id);
            }
        });
    }

    return Results.Created($"/api/leads/{lead.Id}", new
    {
        id = lead.Id,
        message = "Lead received successfully"
    });
})
.AllowAnonymous();

// ---------------------------------------------------------------
// REST API: Media upload, list, delete for CMS image management
// ---------------------------------------------------------------
var allowedImageTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
};
const long maxFileSize = 10 * 1024 * 1024; // 10 MB

app.MapPost("/api/media", async (
    HttpContext httpContext,
    CmsDbContext dbContext,
    ITenantContext tenantContext,
    ILogger<Program> logger) =>
{
    if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
    {
        return Results.BadRequest(new { error = "Portfolio context could not be resolved" });
    }

    var portfolioId = tenantContext.PortfolioId.Value;
    var form = await httpContext.Request.ReadFormAsync();
    var file = form.Files.GetFile("file");

    if (file is null || file.Length == 0)
    {
        return Results.BadRequest(new { error = "No file provided. Include a 'file' field in multipart form data." });
    }

    if (file.Length > maxFileSize)
    {
        return Results.BadRequest(new { error = $"File exceeds maximum size of {maxFileSize / 1024 / 1024} MB" });
    }

    if (!allowedImageTypes.Contains(file.ContentType))
    {
        return Results.BadRequest(new { error = $"Unsupported file type '{file.ContentType}'. Allowed: {string.Join(", ", allowedImageTypes)}" });
    }

    var altText = form.TryGetValue("altText", out var alt) ? alt.ToString() : null;

    // Generate a unique file name to prevent collisions
    var fileExt = System.IO.Path.GetExtension(file.FileName);
    var safeFileName = $"{Guid.NewGuid():N}{fileExt}";
    var portfolioDir = System.IO.Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", portfolioId.ToString());
    Directory.CreateDirectory(portfolioDir);

    var filePath = System.IO.Path.Combine(portfolioDir, safeFileName);
    await using (var stream = new FileStream(filePath, System.IO.FileMode.Create, System.IO.FileAccess.Write))
    {
        await file.CopyToAsync(stream);
    }

    var relativeUrl = $"/uploads/{portfolioId}/{safeFileName}";

    var mediaAsset = new MediaAsset
    {
        Id = Guid.NewGuid(),
        PortfolioId = portfolioId,
        FileName = file.FileName,
        FilePath = relativeUrl,
        MimeType = file.ContentType,
        FileSize = file.Length,
        UploadedAt = DateTime.UtcNow,
        UploadedBy = httpContext.User?.Identity?.Name,
        AltText = altText
    };

    dbContext.MediaAssets.Add(mediaAsset);
    await dbContext.SaveChangesAsync();

    logger.LogInformation(
        "Media uploaded: {FileName} ({MimeType}, {FileSize} bytes) for portfolio {PortfolioId}",
        mediaAsset.FileName, mediaAsset.MimeType, mediaAsset.FileSize, portfolioId);

    return Results.Created($"/api/media/{mediaAsset.Id}", new MediaAssetDto(
        mediaAsset.Id,
        mediaAsset.FileName,
        relativeUrl,
        mediaAsset.MimeType,
        mediaAsset.FileSize,
        mediaAsset.AltText,
        mediaAsset.UploadedAt
    ));
})
.RequireAuthorization()
.DisableAntiforgery();

app.MapGet("/api/media", async (
    HttpContext httpContext,
    CmsDbContext dbContext,
    ITenantContext tenantContext,
    string? search,
    int? page,
    int? pageSize) =>
{
    if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
    {
        return Results.BadRequest(new { error = "Portfolio context could not be resolved" });
    }

    var portfolioId = tenantContext.PortfolioId.Value;
    var take = Math.Clamp(pageSize ?? 50, 1, 100);
    var skip = ((page ?? 1) - 1) * take;

    IQueryable<MediaAsset> query = dbContext.MediaAssets
        .Where(m => m.PortfolioId == portfolioId)
        .OrderByDescending(m => m.UploadedAt);

    if (!string.IsNullOrWhiteSpace(search))
    {
        var term = search.Trim().ToLower();
        query = query.Where(m =>
            m.FileName.ToLower().Contains(term) ||
            (m.AltText != null && m.AltText.ToLower().Contains(term)));
    }

    var total = await query.CountAsync();
    var items = await query
        .Skip(skip)
        .Take(take)
        .Select(m => new MediaAssetDto(
            m.Id,
            m.FileName,
            m.FilePath,
            m.MimeType,
            m.FileSize,
            m.AltText,
            m.UploadedAt
        ))
        .ToListAsync();

    return Results.Ok(new { items, total, page = (skip / take) + 1, pageSize = take });
})
.RequireAuthorization();

app.MapDelete("/api/media/{id:guid}", async (
    Guid id,
    CmsDbContext dbContext,
    ITenantContext tenantContext,
    ILogger<Program> logger) =>
{
    if (!tenantContext.IsResolved || !tenantContext.PortfolioId.HasValue)
    {
        return Results.BadRequest(new { error = "Portfolio context could not be resolved" });
    }

    var portfolioId = tenantContext.PortfolioId.Value;
    var asset = await dbContext.MediaAssets
        .FirstOrDefaultAsync(m => m.Id == id && m.PortfolioId == portfolioId);

    if (asset is null)
    {
        return Results.NotFound(new { error = "Media asset not found" });
    }

    // Delete physical file
    var physicalPath = System.IO.Path.Combine(app.Environment.ContentRootPath, "wwwroot", asset.FilePath.TrimStart('/'));
    if (File.Exists(physicalPath))
    {
        File.Delete(physicalPath);
    }

    dbContext.MediaAssets.Remove(asset);
    await dbContext.SaveChangesAsync();

    logger.LogInformation(
        "Media deleted: {FileName} (ID: {Id}) for portfolio {PortfolioId}",
        asset.FileName, id, portfolioId);

    return Results.Ok(new { message = "Media asset deleted successfully" });
})
.RequireAuthorization();

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

// ---------------------------------------------------------------
// DTO for lead form submissions (OpsBlueprint and similar sites)
// ---------------------------------------------------------------
public record LeadRequest(
    string FullName,
    string Email,
    string? Company,
    string? Industry,
    string? ProblemDescription,
    string? ServiceTier,
    DateTime? SubmittedAt,
    string? Source
);

// ---------------------------------------------------------------
// DTO for media asset responses
// ---------------------------------------------------------------
public record MediaAssetDto(
    Guid Id,
    string FileName,
    string Url,
    string MimeType,
    long FileSize,
    string? AltText,
    DateTime UploadedAt
);
