namespace FV.Domain.Entities;

/// <summary>
/// Represents a lead submission from a portfolio site's contact/lead form.
/// Used by OpsBlueprint (and potentially other consulting-style portfolio sites).
/// Stored per-tenant (PortfolioId) to support multi-tenant isolation.
/// </summary>
public class Lead
{
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the Portfolio this lead was submitted to.
    /// Required for multi-tenant isolation.
    /// </summary>
    public Guid PortfolioId { get; set; }

    public string FullName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Company { get; set; }
    public string? Industry { get; set; }
    public string? ProblemDescription { get; set; }
    public string? ServiceTier { get; set; }

    /// <summary>
    /// The domain/source the lead was submitted from (e.g. "opsblueprint.fernando-vargas.com").
    /// </summary>
    public string? Source { get; set; }

    /// <summary>
    /// Client-side timestamp of when the form was submitted.
    /// </summary>
    public DateTime? SubmittedAt { get; set; }

    /// <summary>
    /// Server-side timestamp of when the lead was received.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Whether this lead has been read/reviewed by an admin.
    /// </summary>
    public bool IsRead { get; set; } = false;

    // Navigation property
    public Portfolio? Portfolio { get; set; }
}
