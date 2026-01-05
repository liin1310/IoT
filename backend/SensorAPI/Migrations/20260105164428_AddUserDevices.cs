using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SensorApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDevices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_sensor_data_table_devices_table_device_id",
                table: "sensor_data_table");

            migrationBuilder.DropPrimaryKey(
                name: "PK_sensor_data_table",
                table: "sensor_data_table");

            migrationBuilder.DropColumn(
                name: "FcmToken",
                table: "users_table");

            migrationBuilder.RenameTable(
                name: "sensor_data_table",
                newName: "user_devices_table");

            migrationBuilder.RenameIndex(
                name: "IX_sensor_data_table_device_id",
                table: "user_devices_table",
                newName: "IX_user_devices_table_device_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_devices_table",
                table: "user_devices_table",
                column: "id");

            migrationBuilder.CreateTable(
                name: "UserDevices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "text", nullable: false),
                    FcmToken = table.Column<string>(type: "text", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDevices", x => x.Id);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_user_devices_table_devices_table_device_id",
                table: "user_devices_table",
                column: "device_id",
                principalTable: "devices_table",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_user_devices_table_devices_table_device_id",
                table: "user_devices_table");

            migrationBuilder.DropTable(
                name: "UserDevices");

            migrationBuilder.DropPrimaryKey(
                name: "PK_user_devices_table",
                table: "user_devices_table");

            migrationBuilder.RenameTable(
                name: "user_devices_table",
                newName: "sensor_data_table");

            migrationBuilder.RenameIndex(
                name: "IX_user_devices_table_device_id",
                table: "sensor_data_table",
                newName: "IX_sensor_data_table_device_id");

            migrationBuilder.AddColumn<string>(
                name: "FcmToken",
                table: "users_table",
                type: "text",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_sensor_data_table",
                table: "sensor_data_table",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_sensor_data_table_devices_table_device_id",
                table: "sensor_data_table",
                column: "device_id",
                principalTable: "devices_table",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
