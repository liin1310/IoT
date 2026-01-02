using Microsoft.AspNetCore.OpenApi;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SensorApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ===================== CORS =====================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ===================== Services =====================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddHostedService<SensorApi.Services.MqttWorker>();

// SỬA LỖI TẠI ĐÂY: Thêm cặp ngoặc nhọn { } vì có 2 dòng lệnh
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    // Bỏ qua cảnh báo PendingModelChanges để chạy ổn định trên Render
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

var app = builder.Build();

// ===================== AUTO MIGRATION & SEED DATA =====================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();

        if (!context.Devices.Any())
        {
            context.Devices.Add(new Device { name = "ESP32 Lab", type = "ESP32", is_online = true });
            context.SaveChanges();
        }
        Console.WriteLine(">>> smarthome-db và Seed Data đã sẵn sàng!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> Lỗi Database: {ex.Message}");
    }
}

// ===================== MIDDLEWARE =====================
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment() || true)
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();
app.Run();