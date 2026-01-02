namespace FV.Domain.Entities;

/// <summary>
/// Represents a portfolio/tenant in the multi-tenant CMS system.
/// Each portfolio has its own content types, content, and can be accessed via its own domain.
/// </summary>
public class Portfolio
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// URL-friendly identifier (e.g., "fernando", "jessica", "busybee")
    /// </summary>
    public string Slug { get; set; } = default!;
    
    /// <summary>
    /// Display name (e.g., "Fernando Vargas Portfolio")
    /// </summary>
    public string Name { get; set; } = default!;
    
    /// <summary>
    /// Primary domain for this portfolio (e.g., "fernando-vargas.com")
    /// </summary>
    public string Domain { get; set; } = default!;
    
    /// <summary>
    /// Optional description of the portfolio
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Whether this portfolio is active and accessible
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<UserPortfolio> UserPortfolios { get; set; } = new List<UserPortfolio>();
    public ICollection<EntityDefinition> EntityDefinitions { get; set; } = new List<EntityDefinition>();
    public ICollection<EntityRecord> EntityRecords { get; set; } = new List<EntityRecord>();
}
