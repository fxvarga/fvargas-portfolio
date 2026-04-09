using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Infrastructure.Seed;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TinyToesDbContext>();

        await context.Database.MigrateAsync();

        if (await context.ClaimCodes.AnyAsync())
            return;

        var devCodes = Enumerable.Range(1, 10).Select(i => new ClaimCode
        {
            Id = Guid.NewGuid(),
            Code = $"TINY-DEV0-{i:D4}",
            Status = ClaimCodeStatus.Unclaimed,
            CreatedAt = DateTime.UtcNow
        });

        context.ClaimCodes.AddRange(devCodes);
        await context.SaveChangesAsync();
    }
}
