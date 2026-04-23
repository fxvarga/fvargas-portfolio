using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using TinyToes.Api.Services;
using TinyToes.Infrastructure;
using TinyToes.Infrastructure.Entities;
using TinyToes.Infrastructure.Entities;

namespace TinyToes.Api.Endpoints;

public static class PrintEndpoints
{
    public static void MapPrintEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/print");

        // Upload PDF blob for print job
        group.MapPost("/upload", async (
            HttpRequest request,
            BlobStorageService blobService,
            TinyToesDbContext db) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest(new { error = "Expected multipart form data." });

            var form = await request.ReadFormAsync();
            var file = form.Files.GetFile("file") ?? form.Files.GetFile("pdf");

            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "No PDF file provided." });

            if (file.Length > 200 * 1024 * 1024) // 200 MB max
                return Results.BadRequest(new { error = "PDF file too large. Maximum 200MB." });

            using var stream = file.OpenReadStream();
            var (blobKey, signedUrl) = await blobService.UploadPdfAsync(stream, file.FileName);

            var upload = new PdfUpload
            {
                Id = Guid.NewGuid(),
                BlobKey = blobKey,
                SignedUrl = signedUrl,
                ExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            };

            db.PdfUploads.Add(upload);
            await db.SaveChangesAsync();

            return Results.Ok(new { blobId = upload.Id.ToString(), url = signedUrl });
        });

        // Get cost estimate for a print book
        group.MapPost("/cost-estimate", async (
            PrintCostEstimateRequest request,
            LuluApiClient luluClient) =>
        {
            if (!luluClient.IsConfigured)
                return Results.StatusCode(503);

            try
            {
                var cost = await luluClient.CalculateCostAsync(
                    request.PodPackageId,
                    request.PageCount,
                    request.ShippingLevel ?? "MAIL",
                    request.Country ?? "US",
                    request.StateCode ?? "",
                    request.PostalCode ?? "");

                var baseCost = cost.LineItemCosts.FirstOrDefault()?.TotalCostInclTax ?? cost.TotalCostInclTax;
                return Results.Ok(new
                {
                    baseCost = decimal.Parse(baseCost),
                    totalCost = decimal.Parse(cost.TotalCostInclTax),
                    currency = cost.Currency,
                    pageCount = request.PageCount
                });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        // Get all shipping options with costs
        group.MapPost("/shipping-options", async (
            PrintShippingOptionsRequest request,
            LuluApiClient luluClient) =>
        {
            if (!luluClient.IsConfigured)
                return Results.StatusCode(503);

            var options = await luluClient.GetShippingOptionsAsync(
                request.PodPackageId,
                request.PageCount,
                1,
                request.Country ?? "US",
                request.StateCode ?? "",
                request.PostalCode ?? "",
                request.City ?? "New York",
                request.Street1 ?? "1 Main St",
                request.PhoneNumber ?? "5551234567");

            var shippingNames = new Dictionary<string, string[]>
            {
                ["MAIL"] = new[] { "Standard Mail", "7-14 business days" },
                ["PRIORITY_MAIL"] = new[] { "Priority Mail", "4-7 business days" },
                ["GROUND_HD"] = new[] { "Ground (Home)", "5-10 business days" },
                ["GROUND_BUS"] = new[] { "Ground (Business)", "5-10 business days" },
                ["EXPEDITED"] = new[] { "Expedited", "3-5 business days" },
                ["EXPRESS"] = new[] { "Express", "1-3 business days" }
            };

            var transformed = options.Select(o =>
            {
                var info = shippingNames.GetValueOrDefault(o.Level, new[] { o.Level, "Varies" });
                return new
                {
                    level = o.Level,
                    name = info[0],
                    costUsd = decimal.Parse(o.ShippingCost.TotalCostInclTax),
                    estimatedDays = info[1]
                };
            });

            return Results.Ok(transformed);
        });

        // Get cover dimensions for a given SKU + page count
        group.MapPost("/cover-dimensions", async (
            PrintCoverDimensionsRequest request,
            LuluApiClient luluClient) =>
        {
            if (!luluClient.IsConfigured)
                return Results.StatusCode(503);

            try
            {
                var dims = await luluClient.GetCoverDimensionsAsync(
                    request.PodPackageId, request.PageCount);
                return Results.Ok(new
                {
                    widthPt = dims.WidthPt,
                    heightPt = dims.HeightPt,
                    unit = "pt"
                });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        // Create Stripe Checkout Session for a print book order
        group.MapPost("/checkout", async (
            PrintCheckoutRequest request,
            IConfiguration config,
            TinyToesDbContext db,
            LuluApiClient luluClient) =>
        {
            var secretKey = config["STRIPE_SECRET_KEY"] ?? config["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(secretKey))
                return Results.StatusCode(503);

            // Validate the product exists and is physical
            var product = await db.Products.FirstOrDefaultAsync(
                p => p.Slug == request.ProductSlug && p.IsActive && p.IsPhysical);

            if (product is null)
                return Results.BadRequest(new { error = $"Physical product '{request.ProductSlug}' not found." });

            if (string.IsNullOrEmpty(product.StripePriceId))
                return Results.StatusCode(503);

            // Validate upload exists
            if (!Guid.TryParse(request.InteriorBlobId, out var interiorId))
                return Results.BadRequest(new { error = "Invalid interior blob ID." });
            var upload = await db.PdfUploads.FindAsync(interiorId);
            if (upload is null)
                return Results.BadRequest(new { error = "PDF upload not found." });

            // Validate page count
            if (product.MinPages.HasValue && request.PageCount < product.MinPages.Value)
                return Results.BadRequest(new { error = $"Minimum page count is {product.MinPages.Value}." });
            if (product.MaxPages.HasValue && request.PageCount > product.MaxPages.Value)
                return Results.BadRequest(new { error = $"Maximum page count is {product.MaxPages.Value}." });

            var frontendOrigin = config["Cors:AllowedOrigins"]
                ?? config["FRONTEND_ORIGIN"]
                ?? "http://localhost:3456";
            var origin = frontendOrigin.Split(',')[0].Trim();

            // Get Lulu cost to calculate total
            int shippingCents = 0;
            try
            {
                var cost = await luluClient.CalculateCostAsync(
                    product.LuluPodPackageId!,
                    request.PageCount,
                    request.ShippingLevel ?? "MAIL",
                    "US", "", "");
                shippingCents = (int)(decimal.Parse(cost.ShippingCost.TotalCostInclTax) * 100);
            }
            catch
            {
                // Fall back to zero shipping if cost calc fails — Stripe will handle
            }

            StripeConfiguration.ApiKey = secretKey;

            // Build line items: product price + shipping if applicable
            var lineItems = new List<SessionLineItemOptions>
            {
                new()
                {
                    Price = product.StripePriceId,
                    Quantity = 1
                }
            };

            // Add shipping as a separate line item if > 0
            if (shippingCents > 0)
            {
                lineItems.Add(new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = "usd",
                        UnitAmount = shippingCents,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = $"Shipping ({request.ShippingLevel ?? "MAIL"})"
                        }
                    },
                    Quantity = 1
                });
            }

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = ["card"],
                LineItems = lineItems,
                Mode = "payment",
                CustomerEmail = request.Email,
                SuccessUrl = $"{origin}/print-order/success?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = $"{origin}/print-order/cancel",
                ShippingAddressCollection = new SessionShippingAddressCollectionOptions
                {
                    AllowedCountries = ["US"]
                },
                PhoneNumberCollection = new SessionPhoneNumberCollectionOptions
                {
                    Enabled = true
                },
                AutomaticTax = new SessionAutomaticTaxOptions { Enabled = true },
                Metadata = new Dictionary<string, string>
                {
                    ["product_slug"] = request.ProductSlug,
                    ["interior_blob_id"] = request.InteriorBlobId,
                    ["cover_blob_id"] = request.CoverBlobId ?? "",
                    ["page_count"] = request.PageCount.ToString(),
                    ["shipping_level"] = request.ShippingLevel ?? "MAIL",
                    ["is_physical"] = "true",
                    ["contact_email"] = request.Email ?? ""
                }
            };

            var service = new SessionService();
            var session = service.Create(options);

            return Results.Ok(new { url = session.Url });
        });

        // Get order status by magic link token
        group.MapGet("/orders/{token}", async (
            string token,
            TinyToesDbContext db) =>
        {
            var statusToken = await db.OrderStatusTokens
                .Include(t => t.Order)
                    .ThenInclude(o => o.ShippingAddress)
                .Include(t => t.Order)
                    .ThenInclude(o => o.PrintJob)
                .FirstOrDefaultAsync(t => t.Token == token);

            if (statusToken is null)
                return Results.NotFound(new { error = "Order not found." });

            if (statusToken.ExpiresAt < DateTime.UtcNow)
                return Results.BadRequest(new { error = "Status link has expired. Request a new one." });

            var order = statusToken.Order;
            var printJob = order.PrintJob;

            // Look up product name
            var product = await db.Products.FirstOrDefaultAsync(p => p.Slug == order.ProductSlug);
            var trackingUrlsList = printJob?.TrackingUrls?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? [];

            return Results.Ok(new
            {
                token,
                status = OrderStatusMapper.MapOrderStatus(order.Status),
                productName = product?.Name ?? order.ProductSlug,
                pageCount = order.PageCount,
                totalPriceUsd = order.AmountCents / 100.0,
                trackingNumber = trackingUrlsList.Length > 0 ? "Track" : (string?)null,
                trackingUrl = trackingUrlsList.FirstOrDefault(),
                createdAt = order.CreatedAt,
                updatedAt = order.UpdatedAt ?? order.CreatedAt
            });
        });

        // Resend magic link email
        group.MapPost("/orders/resend-link", async (
            ResendLinkRequest request,
            TinyToesDbContext db,
            OrderEmailService emailService) =>
        {
            var order = await db.MemoryBookOrders
                .Include(o => o.StatusToken)
                .FirstOrDefaultAsync(o => o.Email == request.Email.Trim().ToLowerInvariant());

            if (order?.StatusToken is null)
                return Results.Ok(new { sent = true }); // Don't leak existence

            await emailService.SendMagicLinkEmailAsync(order.Email, order.StatusToken.Token);
            return Results.Ok(new { sent = true });
        });

        // Get available print products
        group.MapGet("/products", async (TinyToesDbContext db) =>
        {
            var products = await db.Products
                .Where(p => p.IsActive && p.IsPhysical)
                .OrderBy(p => p.SortOrder)
                .Select(p => new
                {
                    p.Slug,
                    p.Name,
                    p.Description,
                    BasePriceUsd = p.PriceUsd,
                    p.LuluPodPackageId,
                    p.MinPages,
                    p.MaxPages
                })
                .ToListAsync();

            return Results.Ok(products);
        });
    }
}

// Request DTOs
public record PrintCostEstimateRequest(
    string PodPackageId,
    int PageCount,
    string? ShippingLevel,
    string? Country,
    string? StateCode,
    string? PostalCode);

public record PrintShippingOptionsRequest(
    string PodPackageId,
    int PageCount,
    string? Country,
    string? StateCode,
    string? PostalCode,
    string? City,
    string? Street1,
    string? PhoneNumber);

public record PrintCoverDimensionsRequest(
    string PodPackageId,
    int PageCount);

public record PrintCheckoutRequest(
    string ProductSlug,
    string InteriorBlobId,
    string? CoverBlobId,
    int PageCount,
    string? ShippingLevel,
    string? Email,
    PrintCheckoutShippingAddress? ShippingAddress);

public record PrintCheckoutShippingAddress(
    string Name,
    string Street1,
    string? Street2,
    string City,
    string StateCode,
    string PostalCode,
    string CountryCode);

internal static class OrderStatusMapper
{
    internal static string MapOrderStatus(OrderStatus status) => status switch
    {
        OrderStatus.Created => "created",
        OrderStatus.PaymentReceived => "payment_in_progress",
        OrderStatus.PrintJobCreated => "production_ready",
        OrderStatus.InProduction => "in_production",
        OrderStatus.Shipped => "shipped",
        OrderStatus.Delivered => "delivered",
        OrderStatus.Canceled => "cancelled",
        OrderStatus.Refunded => "cancelled",
        OrderStatus.Error => "error",
        _ => "created"
    };
}

public record ResendLinkRequest(string Email);
