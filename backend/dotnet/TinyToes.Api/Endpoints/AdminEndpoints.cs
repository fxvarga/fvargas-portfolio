using Microsoft.EntityFrameworkCore;
using TinyToes.Api.Services;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin");

        group.AddEndpointFilter(async (context, next) =>
        {
            var config = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var adminKey = config["ADMIN_API_KEY"];
            var providedKey = context.HttpContext.Request.Headers["X-Admin-Key"].FirstOrDefault();

            if (string.IsNullOrEmpty(adminKey) || providedKey != adminKey)
                return Results.Unauthorized();

            return await next(context);
        });

        group.MapPost("/codes", async (GenerateCodesRequest request, TinyToesDbContext db) =>
        {
            var count = Math.Clamp(request.Count, 1, 100);
            var codes = new List<ClaimCode>();

            for (int i = 0; i < count; i++)
            {
                string code;
                do { code = CodeGenerator.Generate(); }
                while (await db.ClaimCodes.AnyAsync(c => c.Code == code));

                codes.Add(new ClaimCode
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    Status = ClaimCodeStatus.Unclaimed,
                    CreatedAt = DateTime.UtcNow
                });
            }

            db.ClaimCodes.AddRange(codes);
            await db.SaveChangesAsync();

            return Results.Ok(new { generated = codes.Select(c => c.Code).ToList() });
        });

        group.MapGet("/codes", async (TinyToesDbContext db, string? status) =>
        {
            var query = db.ClaimCodes.AsQueryable();

            if (Enum.TryParse<ClaimCodeStatus>(status, true, out var parsedStatus))
                query = query.Where(c => c.Status == parsedStatus);

            var codes = await query
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Code,
                    status = c.Status.ToString(),
                    c.BuyerEmail,
                    c.ClaimedAt,
                    c.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(codes);
        });
    }
}

public record GenerateCodesRequest(int Count = 10);
