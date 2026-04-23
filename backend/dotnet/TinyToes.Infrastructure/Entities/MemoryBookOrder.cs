namespace TinyToes.Infrastructure.Entities;

public class MemoryBookOrder
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string StripeSessionId { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public string LuluPodPackageId { get; set; } = string.Empty;
    public int PageCount { get; set; }
    public int AmountCents { get; set; }
    public int ShippingCents { get; set; }
    public string ShippingLevel { get; set; } = "MAIL";
    public OrderStatus Status { get; set; } = OrderStatus.Created;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public ShippingAddress? ShippingAddress { get; set; }
    public LuluPrintJob? PrintJob { get; set; }
    public List<PdfUpload> PdfUploads { get; set; } = new();
    public OrderStatusToken? StatusToken { get; set; }
}

public enum OrderStatus
{
    Created,
    PaymentReceived,
    PrintJobCreated,
    InProduction,
    Shipped,
    Delivered,
    Canceled,
    Refunded,
    Error
}
