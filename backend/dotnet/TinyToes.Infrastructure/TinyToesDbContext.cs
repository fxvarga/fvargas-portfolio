using Microsoft.EntityFrameworkCore;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Infrastructure;

public class TinyToesDbContext : DbContext
{
    public TinyToesDbContext(DbContextOptions<TinyToesDbContext> options) : base(options) { }

    public DbSet<Buyer> Buyers => Set<Buyer>();
    public DbSet<ClaimCode> ClaimCodes => Set<ClaimCode>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<BuyerProduct> BuyerProducts => Set<BuyerProduct>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Buyer>(entity =>
        {
            entity.HasKey(e => e.BuyerId);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.StripeCustomerId).HasMaxLength(256);
        });

        modelBuilder.Entity<ClaimCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.BuyerEmail).HasMaxLength(256);
            entity.Property(e => e.ProductSlug).IsRequired().HasMaxLength(50);
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

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.ProductId);
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.PriceUsd).HasPrecision(10, 2);
            entity.Property(e => e.StripePriceId).HasMaxLength(256);
            entity.Property(e => e.BundleProductSlugs).HasMaxLength(500);
        });

        modelBuilder.Entity<BuyerProduct>(entity =>
        {
            entity.HasKey(e => e.BuyerProductId);
            entity.Property(e => e.ProductSlug).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => new { e.BuyerId, e.ProductSlug }).IsUnique();
            entity.HasOne(e => e.Buyer)
                .WithMany(b => b.Products)
                .HasForeignKey(e => e.BuyerId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ClaimCode)
                .WithMany()
                .HasForeignKey(e => e.ClaimCodeId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
