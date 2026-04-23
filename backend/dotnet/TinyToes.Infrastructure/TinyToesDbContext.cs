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
    public DbSet<MemoryBookOrder> MemoryBookOrders => Set<MemoryBookOrder>();
    public DbSet<ShippingAddress> ShippingAddresses => Set<ShippingAddress>();
    public DbSet<LuluPrintJob> LuluPrintJobs => Set<LuluPrintJob>();
    public DbSet<PdfUpload> PdfUploads => Set<PdfUpload>();
    public DbSet<OrderStatusToken> OrderStatusTokens => Set<OrderStatusToken>();

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
            entity.Property(e => e.LuluPodPackageId).HasMaxLength(100);
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

        // Print book order entities
        modelBuilder.Entity<MemoryBookOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.StripeSessionId).IsRequired().HasMaxLength(256);
            entity.HasIndex(e => e.StripeSessionId).IsUnique();
            entity.Property(e => e.ProductSlug).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LuluPodPackageId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ShippingLevel).HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<ShippingAddress>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Line1).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Line2).HasMaxLength(300);
            entity.Property(e => e.City).IsRequired().HasMaxLength(100);
            entity.Property(e => e.State).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PostalCode).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Country).IsRequired().HasMaxLength(2);
            entity.Property(e => e.Phone).HasMaxLength(30);
            entity.HasOne(e => e.Order)
                .WithOne(o => o.ShippingAddress)
                .HasForeignKey<ShippingAddress>(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LuluPrintJob>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.LuluPrintJobId).IsUnique().HasFilter("\"LuluPrintJobId\" IS NOT NULL");
            entity.Property(e => e.Status).HasMaxLength(40);
            entity.HasOne(e => e.Order)
                .WithOne(o => o.PrintJob)
                .HasForeignKey<LuluPrintJob>(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PdfUpload>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BlobKey).IsRequired().HasMaxLength(500);
            entity.Property(e => e.SignedUrl).HasMaxLength(2000);
            entity.HasOne(e => e.Order)
                .WithMany(o => o.PdfUploads)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OrderStatusToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(128);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.Order)
                .WithOne(o => o.StatusToken)
                .HasForeignKey<OrderStatusToken>(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
