using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SensorApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialUserDeviceSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_user_devices_table_devices_table_device_id",
                table: "user_devices_table");

            migrationBuilder.DropTable(
                name: "UserDevices");

            migrationBuilder.DropIndex(
                name: "IX_user_devices_table_device_id",
                table: "user_devices_table");

            migrationBuilder.DropColumn(
                name: "device_id",
                table: "user_devices_table");

            migrationBuilder.DropColumn(
                name: "value",
                table: "user_devices_table");

            migrationBuilder.RenameColumn(
                name: "type",
                table: "user_devices_table",
                newName: "username");

            migrationBuilder.RenameColumn(
                name: "received_at",
                table: "user_devices_table",
                newName: "last_updated");

            migrationBuilder.AddColumn<string>(
                name: "fcm_token",
                table: "user_devices_table",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "sensor_data_table",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    device_id = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<double>(type: "double precision", nullable: false),
                    received_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sensor_data_table", x => x.id);
                    table.ForeignKey(
                        name: "FK_sensor_data_table_devices_table_device_id",
                        column: x => x.device_id,
                        principalTable: "devices_table",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sensor_data_table_device_id",
                table: "sensor_data_table",
                column: "device_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sensor_data_table");

            migrationBuilder.DropColumn(
                name: "fcm_token",
                table: "user_devices_table");

            migrationBuilder.RenameColumn(
                name: "username",
                table: "user_devices_table",
                newName: "type");

            migrationBuilder.RenameColumn(
                name: "last_updated",
                table: "user_devices_table",
                newName: "received_at");

            migrationBuilder.AddColumn<int>(
                name: "device_id",
                table: "user_devices_table",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "value",
                table: "user_devices_table",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.CreateTable(
                name: "UserDevices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FcmToken = table.Column<string>(type: "text", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Username = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDevices", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_devices_table_device_id",
                table: "user_devices_table",
                column: "device_id");

            migrationBuilder.AddForeignKey(
                name: "FK_user_devices_table_devices_table_device_id",
                table: "user_devices_table",
                column: "device_id",
                principalTable: "devices_table",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
