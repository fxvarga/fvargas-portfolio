namespace FV.Domain.Entities;

/// <summary>
/// Represents a catering inquiry submission from a portfolio site's contact/inquiry form.
/// Stored per-tenant (PortfolioId) to support multi-tenant isolation.
/// </summary>
public class Inquiry
{
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the Portfolio this inquiry was submitted to.
    /// Required for multi-tenant isolation.
    /// </summary>
    public Guid PortfolioId { get; set; }

    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Phone { get; set; }
    public string? Company { get; set; }
    public string? Nonprofit { get; set; }
    public string? EventDate { get; set; }
    public string? HasVenue { get; set; }
    public string? VenueName { get; set; }
    public string? Budget { get; set; }
    public string? GuestCount { get; set; }

    /// <summary>
    /// The domain/source the inquiry was submitted from (e.g. "executivecateringct.com").
    /// </summary>
    public string? Source { get; set; }

    /// <summary>
    /// Client-side timestamp of when the form was submitted.
    /// </summary>
    public DateTime? SubmittedAt { get; set; }

    /// <summary>
    /// Server-side timestamp of when the inquiry was received.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether this inquiry has been read/reviewed by an admin.
    /// </summary>
    public bool IsRead { get; set; } = false;

    // Navigation property
    public Portfolio? Portfolio { get; set; }
}
