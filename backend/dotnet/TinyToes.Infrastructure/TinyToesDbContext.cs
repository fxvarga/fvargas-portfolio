using Microsoft.EntityFrameworkCore;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Infrastructure;

public class TinyToesDbContext : DbContext
{
    public TinyToesDbContext(DbContextOptions<TinyToesDbContext> options) : base(options) { }

    public DbSet<Buyer> Buyers => Set<Buyer>();
    public DbSet<ClaimCode> ClaimCodes => Set<ClaimCode>();
    public DbSet<Session> Sessions => Set<Session>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Buyer>(entity =>
        {
            entity.HasKey(e => e.BuyerId);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Product).IsRequired().HasMaxLength(100);
            entity.Property(e => e.StripeCustomerId).HasMaxLength(256);
        });

        modelBuilder.Entity<ClaimCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.BuyerEmail).HasMaxLength(256);
            entity.HasOne(e => e.Buyer)
                .WithMany(b => b.ClaimCodes)
                .HasForeignKey(e => e.BuyerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasKey(e => e.SessionId);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(512);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.Buyer)
                .WithMany(b => b.Sessions)
                .HasForeignKey(e => e.BuyerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
