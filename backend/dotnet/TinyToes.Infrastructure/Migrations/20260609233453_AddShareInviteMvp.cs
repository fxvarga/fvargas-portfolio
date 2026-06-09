using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TinyToes.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShareInviteMvp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExportManifests",
                columns: table => new
                {
                    ExportId = table.Column<Guid>(type: "uuid", nullable: false),
                    SchemaVersion = table.Column<int>(type: "integer", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StateJson = table.Column<string>(type: "text", nullable: false),
                    TotalAssetBytes = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExportManifests", x => x.ExportId);
                });

            migrationBuilder.CreateTable(
                name: "ExportManifestAssets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExportId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssetId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CloudKitZoneName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CloudKitRecordName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CloudKitFieldName = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    FileName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ContentType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: true),
                    Height = table.Column<int>(type: "integer", nullable: true),
                    Sha256 = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ByteSize = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExportManifestAssets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExportManifestAssets_ExportManifests_ExportId",
                        column: x => x.ExportId,
                        principalTable: "ExportManifests",
                        principalColumn: "ExportId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShareInvites",
                columns: table => new
                {
                    InviteId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientEmailNormalized = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ExportId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClaimedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClaimedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportStartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConsumedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerificationTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerificationTokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    VerificationTokenUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImportTokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    ImportTokenUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastError = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShareInvites", x => x.InviteId);
                    table.ForeignKey(
                        name: "FK_ShareInvites_ExportManifests_ExportId",
                        column: x => x.ExportId,
                        principalTable: "ExportManifests",
                        principalColumn: "ExportId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExportManifestAssets_ExportId_AssetId",
                table: "ExportManifestAssets",
                columns: new[] { "ExportId", "AssetId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShareInvites_CodeHash",
                table: "ShareInvites",
                column: "CodeHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShareInvites_ExpiresAt",
                table: "ShareInvites",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ShareInvites_ExportId",
                table: "ShareInvites",
                column: "ExportId");

            migrationBuilder.CreateIndex(
                name: "IX_ShareInvites_RecipientEmailNormalized_Status",
                table: "ShareInvites",
                columns: new[] { "RecipientEmailNormalized", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExportManifestAssets");

            migrationBuilder.DropTable(
                name: "ShareInvites");

            migrationBuilder.DropTable(
                name: "ExportManifests");
        }
    }
}
