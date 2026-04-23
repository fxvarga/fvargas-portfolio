namespace TinyToes.Infrastructure.Entities;

public class ShippingAddress
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "US";
    public string? Phone { get; set; }

    // Navigation
    public MemoryBookOrder Order { get; set; } = null!;
}
