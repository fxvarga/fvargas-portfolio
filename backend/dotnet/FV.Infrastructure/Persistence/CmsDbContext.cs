using Microsoft.EntityFrameworkCore;
using FV.Domain.Entities;
using System.Text.Json;

namespace FV.Infrastructure.Persistence;

public class CmsDbContext : DbContext
{
    public CmsDbContext(DbContextOptions<CmsDbContext> options) : base(options)
    {
    }

    // Multi-tenant entities
    public DbSet<Portfolio> Portfolios { get; set; } = null!;
    public DbSet<UserPortfolio> UserPortfolios { get; set; } = null!;

    // Existing entities
    public DbSet<CmsUser> Users { get; set; } = null!;
    public DbSet<EntityDefinition> EntityDefinitions { get; set; } = null!;
    public DbSet<EntityRecord> EntityRecords { get; set; } = null!;
    public DbSet<EntityRecordVersion> EntityRecordVersions { get; set; } = null!;
    public DbSet<MediaAsset> MediaAssets { get; set; } = null!;

    // Content migration tracking (Rails-style migrations for content)
    public DbSet<ContentMigrationHistory> ContentMigrationHistory { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Portfolio configuration
        modelBuilder.Entity<Portfolio>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => e.Domain).IsUnique();
            entity.Property(e => e.Slug).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Domain).IsRequired().HasMaxLength(255);
        });

        // UserPortfolio configuration (many-to-many junction table)
        modelBuilder.Entity<UserPortfolio>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.PortfolioId });

            entity.HasOne(e => e.User)
                .WithMany(u => u.UserPortfolios)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Portfolio)
                .WithMany(p => p.UserPortfolios)
                .HasForeignKey(e => e.PortfolioId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
        });

        // CmsUser configuration
        modelBuilder.Entity<CmsUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
        });

        // EntityDefinition configuration
        modelBuilder.Entity<EntityDefinition>(entity =>
        {
            entity.HasKey(e => e.Id);

            // Unique constraint on Name within a Portfolio (not globally unique anymore)
            entity.HasIndex(e => new { e.PortfolioId, e.Name }).IsUnique();

            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PortfolioId).IsRequired();

            // Foreign key to Portfolio
            entity.HasOne(e => e.Portfolio)
                .WithMany(p => p.EntityDefinitions)
                .HasForeignKey(e => e.PortfolioId)
                .OnDelete(DeleteBehavior.Cascade);

            // Store Attributes as JSON
            entity.Property(e => e.Attributes)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<AttributeDefinition>>(v, (JsonSerializerOptions?)null) ?? new List<AttributeDefinition>()
                );

            // Store Relationships as JSON
            entity.Property(e => e.Relationships)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<RelationshipDefinition>>(v, (JsonSerializerOptions?)null)
                );
        });

        // EntityRecord configuration
        modelBuilder.Entity<EntityRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.PortfolioId, e.EntityType });
            entity.HasIndex(e => new { e.PortfolioId, e.EntityType, e.IsDraft });
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.JsonData).IsRequired();
            entity.Property(e => e.PortfolioId).IsRequired();

            // Foreign key to Portfolio
            entity.HasOne(e => e.Portfolio)
                .WithMany(p => p.EntityRecords)
                .HasForeignKey(e => e.PortfolioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // EntityRecordVersion configuration (for version history)
        modelBuilder.Entity<EntityRecordVersion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EntityRecordId);
            entity.HasIndex(e => new { e.EntityRecordId, e.Version });
            entity.HasIndex(e => e.PortfolioId);
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.JsonData).IsRequired();
            entity.Property(e => e.PortfolioId).IsRequired();

            // Foreign key to Portfolio
            entity.HasOne(e => e.Portfolio)
                .WithMany()
                .HasForeignKey(e => e.PortfolioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MediaAsset configuration
        modelBuilder.Entity<MediaAsset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PortfolioId);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PortfolioId).IsRequired();

            // Foreign key to Portfolio
            entity.HasOne(e => e.Portfolio)
                .WithMany()
                .HasForeignKey(e => e.PortfolioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ContentMigrationHistory configuration (tracks applied content migrations)
        modelBuilder.Entity<ContentMigrationHistory>(entity =>
        {
            entity.HasKey(e => e.MigrationId);
            entity.Property(e => e.MigrationId).HasMaxLength(100);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Checksum).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.ErrorMessage).HasMaxLength(2000);
        });
    }
}
