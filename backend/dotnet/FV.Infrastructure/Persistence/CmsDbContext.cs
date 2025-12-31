using Microsoft.EntityFrameworkCore;
using FV.Domain.Entities;
using System.Text.Json;

namespace FV.Infrastructure.Persistence;

public class CmsDbContext : DbContext
{
    public CmsDbContext(DbContextOptions<CmsDbContext> options) : base(options)
    {
    }

    public DbSet<CmsUser> Users { get; set; } = null!;
    public DbSet<EntityDefinition> EntityDefinitions { get; set; } = null!;
    public DbSet<EntityRecord> EntityRecords { get; set; } = null!;
    public DbSet<EntityRecordVersion> EntityRecordVersions { get; set; } = null!;
    public DbSet<MediaAsset> MediaAssets { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            
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
            entity.HasIndex(e => e.EntityType);
            entity.HasIndex(e => new { e.EntityType, e.IsDraft });
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.JsonData).IsRequired();
        });

        // EntityRecordVersion configuration (for version history)
        modelBuilder.Entity<EntityRecordVersion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.EntityRecordId);
            entity.HasIndex(e => new { e.EntityRecordId, e.Version });
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.JsonData).IsRequired();
        });

        // MediaAsset configuration
        modelBuilder.Entity<MediaAsset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
        });
    }
}
