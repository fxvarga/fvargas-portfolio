namespace TinyToes.Infrastructure.Entities;

public class Product
{
    public Guid ProductId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal PriceUsd { get; set; }
    public string? StripePriceId { get; set; }
    public bool IsBundle { get; set; }
    public string? BundleProductSlugs { get; set; } // comma-separated slugs for bundles
    public bool IsPhysical { get; set; }
    public string? LuluPodPackageId { get; set; }
    public int? MinPages { get; set; }
    public int? MaxPages { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
