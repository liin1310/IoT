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

// Cấu hình OpenAPI (thay thế SwaggerGen)
builder.Services.AddOpenApi();

// Đăng ký Background Service MQTT của Thu
builder.Services.AddHostedService<SensorApi.Services.MqttWorker>();

// Cấu hình kết nối PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

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

// Bật giao diện Scalar thay cho Swagger (Truy cập qua /scalar/v1)
if (app.Environment.IsDevelopment() || true) // Bật luôn trên Render để nhóm test
{
    app.MapOpenApi(); // Tạo file spec /openapi/v1.json
    app.MapScalarApiReference(); // Tạo giao diện tại /scalar/v1
}

if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();
app.Run();