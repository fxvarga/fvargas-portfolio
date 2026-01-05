namespace FV.Domain.Entities;

public class CmsUser
{
    public Guid Id { get; set; }
    public string Username { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Role { get; set; } = "Admin"; // Admin, Editor, Viewer (global role)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation property for portfolio access
    public ICollection<UserPortfolio> UserPortfolios { get; set; } = new List<UserPortfolio>();
}
