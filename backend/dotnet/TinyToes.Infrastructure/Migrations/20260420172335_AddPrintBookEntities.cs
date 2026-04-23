using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TinyToes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPrintBookEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPhysical",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LuluPodPackageId",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxPages",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinPages",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MemoryBookOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    StripeSessionId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ProductSlug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LuluPodPackageId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PageCount = table.Column<int>(type: "integer", nullable: false),
                    AmountCents = table.Column<int>(type: "integer", nullable: false),
                    ShippingCents = table.Column<int>(type: "integer", nullable: false),
                    ShippingLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemoryBookOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LuluPrintJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    LuluPrintJobId = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    TrackingUrls = table.Column<string>(type: "text", nullable: true),
                    RawPayload = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastStatusAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LuluPrintJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LuluPrintJobs_MemoryBookOrders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "MemoryBookOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderStatusTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStatusTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderStatusTokens_MemoryBookOrders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "MemoryBookOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PdfUploads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BlobKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SignedUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PdfUploads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PdfUploads_MemoryBookOrders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "MemoryBookOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ShippingAddresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Line1 = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Line2 = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Country = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingAddresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShippingAddresses_MemoryBookOrders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "MemoryBookOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LuluPrintJobs_LuluPrintJobId",
                table: "LuluPrintJobs",
                column: "LuluPrintJobId",
                unique: true,
                filter: "\"LuluPrintJobId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_LuluPrintJobs_OrderId",
                table: "LuluPrintJobs",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemoryBookOrders_StripeSessionId",
                table: "MemoryBookOrders",
                column: "StripeSessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusTokens_OrderId",
                table: "OrderStatusTokens",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusTokens_Token",
                table: "OrderStatusTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PdfUploads_OrderId",
                table: "PdfUploads",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShippingAddresses_OrderId",
                table: "ShippingAddresses",
                column: "OrderId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LuluPrintJobs");

            migrationBuilder.DropTable(
                name: "OrderStatusTokens");

            migrationBuilder.DropTable(
                name: "PdfUploads");

            migrationBuilder.DropTable(
                name: "ShippingAddresses");

            migrationBuilder.DropTable(
                name: "MemoryBookOrders");

            migrationBuilder.DropColumn(
                name: "IsPhysical",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "LuluPodPackageId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MaxPages",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MinPages",
                table: "Products");
        }
    }
}
