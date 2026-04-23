using Microsoft.EntityFrameworkCore;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Services;

public class StripeWebhookService
{
    private readonly TinyToesDbContext _db;
    private readonly GraphEmailService _emailService;
    private readonly OrderEmailService _orderEmailService;
    private readonly LuluApiClient _luluClient;
    private readonly BlobStorageService _blobService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<StripeWebhookService> _logger;

    public StripeWebhookService(
        TinyToesDbContext db,
        GraphEmailService emailService,
        OrderEmailService orderEmailService,
        LuluApiClient luluClient,
        BlobStorageService blobService,
        IConfiguration configuration,
        ILogger<StripeWebhookService> logger)
    {
        _db = db;
        _emailService = emailService;
        _orderEmailService = orderEmailService;
        _luluClient = luluClient;
        _blobService = blobService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Handle digital product checkout — generates claim code + sends email.
    /// </summary>
    public async Task<string> HandleCheckoutCompletedAsync(
        string customerEmail,
        string? customerName,
        string? stripeCustomerId,
        string productSlug = "first-foods")
    {
        var normalizedEmail = customerEmail.Trim().ToLowerInvariant();

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Slug == productSlug);
        var productName = product?.Name ?? "Baby First Bites";

        var code = CodeGenerator.Generate();
        while (await _db.ClaimCodes.AnyAsync(c => c.Code == code))
            code = CodeGenerator.Generate();

        var claimCode = new ClaimCode
        {
            Id = Guid.NewGuid(),
            Code = code,
            ProductSlug = productSlug,
            Status = ClaimCodeStatus.Unclaimed,
            CreatedAt = DateTime.UtcNow
        };
        _db.ClaimCodes.Add(claimCode);
        await _db.SaveChangesAsync();

        try
        {
            var frontendUrl = _configuration["FRONTEND_ORIGIN"]
                ?? _configuration["Cors:AllowedOrigins"]?.Split(',')[0]
                ?? "https://tinytoes.example.com";

            await _emailService.SendClaimCodeEmailAsync(
                normalizedEmail, customerName ?? "", code, frontendUrl, productName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send claim code email to {Email}. Code: {Code}", normalizedEmail, code);
        }

        return code;
    }

    /// <summary>
    /// Handle physical print book checkout — creates order, Lulu print job, sends confirmation.
    /// Also grants the digital bundle as part of the physical purchase.
    /// </summary>
    public async Task HandlePhysicalCheckoutCompletedAsync(
        Stripe.Checkout.Session session)
    {
        var email = session.CustomerDetails?.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
        {
            _logger.LogError("Physical checkout completed but no email found. SessionId={SessionId}", session.Id);
            return;
        }

        var metadata = session.Metadata ?? new Dictionary<string, string>();
        var productSlug = metadata.GetValueOrDefault("product_slug") ?? "";
        var uploadIdStr = metadata.GetValueOrDefault("interior_blob_id") ?? metadata.GetValueOrDefault("upload_id") ?? "";
        var coverBlobIdStr = metadata.GetValueOrDefault("cover_blob_id") ?? "";
        var pageCountStr = metadata.GetValueOrDefault("page_count") ?? "0";
        var shippingLevel = metadata.GetValueOrDefault("shipping_level") ?? "MAIL";

        if (!Guid.TryParse(uploadIdStr, out var uploadId))
        {
            _logger.LogError("Invalid upload_id in checkout metadata: {UploadId}", uploadIdStr);
            return;
        }

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Slug == productSlug);
        if (product is null)
        {
            _logger.LogError("Product not found for physical checkout: {Slug}", productSlug);
            return;
        }

        var upload = await _db.PdfUploads.FindAsync(uploadId);
        if (upload is null)
        {
            _logger.LogError("PDF upload not found: {UploadId}", uploadId);
            return;
        }

        var pageCount = int.TryParse(pageCountStr, out var pc) ? pc : 0;

        // Create the order
        var order = new MemoryBookOrder
        {
            Id = Guid.NewGuid(),
            Email = email,
            StripeSessionId = session.Id,
            ProductSlug = productSlug,
            LuluPodPackageId = product.LuluPodPackageId ?? "",
            PageCount = pageCount,
            AmountCents = (int)(session.AmountTotal ?? 0),
            ShippingCents = 0,
            ShippingLevel = shippingLevel,
            Status = OrderStatus.PaymentReceived,
            CreatedAt = DateTime.UtcNow
        };

        // Extract shipping address from Stripe session
        var stripeAddr = session.ShippingDetails?.Address;
        if (stripeAddr is not null)
        {
            var shippingAddress = new ShippingAddress
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                Name = session.ShippingDetails?.Name ?? "",
                Line1 = stripeAddr.Line1 ?? "",
                Line2 = stripeAddr.Line2,
                City = stripeAddr.City ?? "",
                State = stripeAddr.State ?? "",
                PostalCode = stripeAddr.PostalCode ?? "",
                Country = stripeAddr.Country ?? "US",
                Phone = session.CustomerDetails?.Phone
            };
            _db.ShippingAddresses.Add(shippingAddress);
        }

        // Look up cover PDF upload (separate from interior)
        PdfUpload? coverUpload = null;
        if (Guid.TryParse(coverBlobIdStr, out var coverBlobId))
        {
            coverUpload = await _db.PdfUploads.FindAsync(coverBlobId);
            if (coverUpload is null)
                _logger.LogWarning("Cover PDF upload not found: {CoverBlobId}", coverBlobIdStr);
        }

        // Link uploads to order
        upload.OrderId = order.Id;
        if (coverUpload is not null)
            coverUpload.OrderId = order.Id;

        // Create order status token (magic link)
        var statusToken = new OrderStatusToken
        {
            Id = Guid.NewGuid(),
            Token = GenerateStatusToken(),
            OrderId = order.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(365), // 1 year validity
            CreatedAt = DateTime.UtcNow
        };

        _db.MemoryBookOrders.Add(order);
        _db.OrderStatusTokens.Add(statusToken);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created print order {OrderId} for {Email}, product={Slug}",
            order.Id, email, productSlug);

        // Create Lulu print job
        try
        {
            await CreateLuluPrintJobAsync(order, upload, coverUpload, stripeAddr, session.ShippingDetails?.Name, shippingLevel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Lulu print job for order {OrderId}", order.Id);
            order.Status = OrderStatus.Error;
            await _db.SaveChangesAsync();
        }

        // Send order confirmation email
        try
        {
            await _orderEmailService.SendOrderConfirmationEmailAsync(
                email, product.Name, statusToken.Token);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send order confirmation to {Email}", email);
        }

        // Grant digital bundle (first-year-bundle) as part of physical purchase
        await GrantDigitalBundleAsync(email, session.CustomerId);
    }

    /// <summary>
    /// Retry a failed order by re-creating the Lulu print job.
    /// </summary>
    public async Task<string> RetryFailedOrderAsync(Guid orderId)
    {
        var order = await _db.MemoryBookOrders
            .Include(o => o.ShippingAddress)
            .FirstOrDefaultAsync(o => o.Id == orderId);
        if (order is null) return "Order not found";
        if (order.Status != OrderStatus.Error) return $"Order status is {order.Status}, not Error";

        // Find uploads linked to this order, distinguishing interior from cover by blob key
        var allUploads = await _db.PdfUploads.Where(u => u.OrderId == orderId).ToListAsync();
        if (allUploads.Count == 0) return "No PDF upload found for this order";

        var interiorUpload = allUploads.FirstOrDefault(u => u.BlobKey.Contains("interior")) ?? allUploads[0];
        var coverUpload = allUploads.FirstOrDefault(u => u.BlobKey.Contains("cover"))
                          ?? (allUploads.Count > 1 ? allUploads.First(u => u.Id != interiorUpload.Id) : null);

        var addr = order.ShippingAddress;
        if (addr is null || string.IsNullOrWhiteSpace(addr.Line1))
            return "Order has no shipping address — cannot retry";
        var stripeAddr = new Stripe.Address
        {
            Line1 = addr.Line1,
            Line2 = addr.Line2,
            City = addr.City,
            State = addr.State,
            PostalCode = addr.PostalCode,
            Country = addr.Country
        };

        var shippingName = addr.Name;

        await CreateLuluPrintJobAsync(order, interiorUpload, coverUpload, stripeAddr, shippingName, order.ShippingLevel ?? "MAIL");
        return "Print job created successfully";
    }

    /// <summary>
    /// Handle refund — cancel Lulu print job if still UNPAID.
    /// </summary>
    public async Task HandleChargeRefundedAsync(string chargeId)
    {
        // Find order by looking up the Stripe session
        // Note: In a real implementation you'd look up via charge -> payment_intent -> session
        _logger.LogInformation("Charge refunded: {ChargeId}. Manual review needed for print job cancellation.", chargeId);
    }

    private async Task CreateLuluPrintJobAsync(
        MemoryBookOrder order,
        PdfUpload interiorUpload,
        PdfUpload? coverUpload,
        Stripe.Address? stripeAddr,
        string? shippingName,
        string shippingLevel)
    {
        if (!_luluClient.IsConfigured)
        {
            _logger.LogWarning("Lulu API not configured — skipping print job creation");
            return;
        }

        // Always regenerate presigned URLs to ensure fresh SigV4 signatures
        var interiorPdfUrl = _blobService.GeneratePresignedUrl(interiorUpload.BlobKey, TimeSpan.FromHours(24));
        interiorUpload.SignedUrl = interiorPdfUrl;
        interiorUpload.ExpiresAt = DateTime.UtcNow.AddHours(24);

        // Refresh cover signed URL; fall back to interior if no cover
        var coverPdfUrl = interiorPdfUrl;
        if (coverUpload is not null)
        {
            coverPdfUrl = _blobService.GeneratePresignedUrl(coverUpload.BlobKey, TimeSpan.FromHours(24));
            coverUpload.SignedUrl = coverPdfUrl;
            coverUpload.ExpiresAt = DateTime.UtcNow.AddHours(24);
        }

        await _db.SaveChangesAsync();

        var luluAddress = new LuluApiClient.LuluShippingAddress
        {
            Name = !string.IsNullOrWhiteSpace(shippingName) ? shippingName : (order.Email ?? "Customer"),
            Street1 = stripeAddr?.Line1 ?? "",
            Street2 = stripeAddr?.Line2,
            City = stripeAddr?.City ?? "",
            StateCode = stripeAddr?.State ?? "",
            PostalCode = stripeAddr?.PostalCode ?? "",
            CountryCode = stripeAddr?.Country ?? "US",
            PhoneNumber = "5551234567"
        };

        var luluJob = await _luluClient.CreatePrintJobAsync(
            title: $"TinyToes Memory Book - {order.Id.ToString()[..8]}",
            podPackageId: order.LuluPodPackageId,
            pageCount: order.PageCount,
            interiorPdfUrl: interiorPdfUrl,
            coverPdfUrl: coverPdfUrl,
            shippingAddress: luluAddress,
            shippingLevel: shippingLevel,
            contactEmail: order.Email);

        // Save the Lulu print job reference
        var printJob = new LuluPrintJob
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            LuluPrintJobId = luluJob.Id,
            Status = luluJob.Status.Name,
            CreatedAt = DateTime.UtcNow,
            LastStatusAt = DateTime.UtcNow
        };

        _db.LuluPrintJobs.Add(printJob);
        order.Status = OrderStatus.PrintJobCreated;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Lulu print job created: {LuluId} for order {OrderId}",
            luluJob.Id, order.Id);
    }

    private async Task GrantDigitalBundleAsync(string email, string? stripeCustomerId)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        // Find existing buyer and their owned products
        var buyer = await _db.Buyers.FirstOrDefaultAsync(b => b.Email == normalizedEmail);
        var ownedSlugs = buyer is not null
            ? await _db.BuyerProducts.Where(bp => bp.BuyerId == buyer.BuyerId)
                .Select(bp => bp.ProductSlug).ToListAsync()
            : new List<string>();

        var bundleSlugs = new[] { "first-foods", "milestones", "monthly-journal" };
        var newCodes = new List<(string slug, string code, string productName)>();

        foreach (var slug in bundleSlugs)
        {
            // Skip if buyer already owns this product
            if (ownedSlugs.Contains(slug)) continue;

            try
            {
                var product = await _db.Products.FirstOrDefaultAsync(p => p.Slug == slug);
                var productName = product?.Name ?? slug;

                var code = CodeGenerator.Generate();
                while (await _db.ClaimCodes.AnyAsync(c => c.Code == code))
                    code = CodeGenerator.Generate();

                var claimCode = new ClaimCode
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    ProductSlug = slug,
                    BuyerEmail = normalizedEmail,
                    BuyerId = buyer?.BuyerId,
                    Status = ClaimCodeStatus.Unclaimed,
                    CreatedAt = DateTime.UtcNow
                };
                _db.ClaimCodes.Add(claimCode);
                newCodes.Add((slug, code, productName));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate claim code for {Slug}", slug);
            }
        }

        if (newCodes.Count == 0)
        {
            _logger.LogInformation("Buyer {Email} already owns all bundle products, skipping grant", normalizedEmail);
            return;
        }

        await _db.SaveChangesAsync();

        // Send a single email with all new codes
        try
        {
            var frontendUrl = _configuration["FRONTEND_ORIGIN"]
                ?? _configuration["Cors:AllowedOrigins"]?.Split(',')[0]
                ?? "https://tinytoes.example.com";

            var codesText = string.Join("\n", newCodes.Select(c => $"  {c.productName}: {c.code}"));
            var productNames = string.Join(", ", newCodes.Select(c => c.productName));

            await _emailService.SendClaimCodeEmailAsync(
                normalizedEmail, "", newCodes.First().code, frontendUrl,
                $"Digital Bundle ({productNames})");

            _logger.LogInformation("Sent bundle claim codes to {Email}: {Products}",
                normalizedEmail, productNames);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send bundle claim email to {Email}", normalizedEmail);
        }
    }

    private static string GenerateStatusToken()
    {
        var bytes = new byte[32];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}
