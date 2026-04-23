using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TinyToes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PdfUploadOneToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PdfUploads_OrderId",
                table: "PdfUploads");

            migrationBuilder.CreateIndex(
                name: "IX_PdfUploads_OrderId",
                table: "PdfUploads",
                column: "OrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PdfUploads_OrderId",
                table: "PdfUploads");

            migrationBuilder.CreateIndex(
                name: "IX_PdfUploads_OrderId",
                table: "PdfUploads",
                column: "OrderId",
                unique: true);
        }
    }
}
