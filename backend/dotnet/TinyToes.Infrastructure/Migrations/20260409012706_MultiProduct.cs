using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TinyToes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MultiProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Product",
                table: "Buyers");

            migrationBuilder.AddColumn<string>(
                name: "ProductSlug",
                table: "ClaimCodes",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "first-foods");

            migrationBuilder.CreateTable(
                name: "BuyerProducts",
                columns: table => new
                {
                    BuyerProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    BuyerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductSlug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ClaimCodeId = table.Column<Guid>(type: "uuid", nullable: true),
                    GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuyerProducts", x => x.BuyerProductId);
                    table.ForeignKey(
                        name: "FK_BuyerProducts_Buyers_BuyerId",
                        column: x => x.BuyerId,
                        principalTable: "Buyers",
                        principalColumn: "BuyerId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BuyerProducts_ClaimCodes_ClaimCodeId",
                        column: x => x.ClaimCodeId,
                        principalTable: "ClaimCodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PriceUsd = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    StripePriceId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    IsBundle = table.Column<bool>(type: "boolean", nullable: false),
                    BundleProductSlugs = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.ProductId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BuyerProducts_BuyerId_ProductSlug",
                table: "BuyerProducts",
                columns: new[] { "BuyerId", "ProductSlug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BuyerProducts_ClaimCodeId",
                table: "BuyerProducts",
                column: "ClaimCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Slug",
                table: "Products",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BuyerProducts");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropColumn(
                name: "ProductSlug",
                table: "ClaimCodes");

            migrationBuilder.AddColumn<string>(
                name: "Product",
                table: "Buyers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
