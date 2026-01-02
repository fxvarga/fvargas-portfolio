namespace FV.Domain.Entities;

/// <summary>
/// Junction table for many-to-many relationship between Users and Portfolios.
/// Defines which users have access to which portfolios and their role within each.
/// </summary>
public class UserPortfolio
{
    public Guid UserId { get; set; }
    public Guid PortfolioId { get; set; }
    
    /// <summary>
    /// Role within this specific portfolio: Admin, Editor, Viewer
    /// </summary>
    public string Role { get; set; } = "Editor";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public CmsUser User { get; set; } = null!;
    public Portfolio Portfolio { get; set; } = null!;
}

/// <summary>
/// Constants for portfolio roles
/// </summary>
public static class PortfolioRoles
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
    public const string Viewer = "Viewer";
}
