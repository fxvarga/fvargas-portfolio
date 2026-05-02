using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TinyToes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppleIapColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AppleTransactionId",
                table: "BuyerProducts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "BuyerProducts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AppleTransactionId",
                table: "BuyerProducts");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "BuyerProducts");
        }
    }
}
