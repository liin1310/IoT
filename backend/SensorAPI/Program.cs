// using Microsoft.AspNetCore.OpenApi;
// using Microsoft.EntityFrameworkCore;
// using Scalar.AspNetCore;
// using SensorApi.Models;

// var builder = WebApplication.CreateBuilder(args);

// // ===================== CORS =====================
// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowAll", policy =>
//     {
//         policy.AllowAnyOrigin()
//               .AllowAnyMethod()
//               .AllowAnyHeader();
//     });
// });

// // ===================== Services =====================
// builder.Services.AddControllers();
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddOpenApi();

// builder.Services.AddHostedService<SensorApi.Services.MqttWorker>();

// // SỬA LỖI TẠI ĐÂY: Thêm cặp ngoặc nhọn { } vì có 2 dòng lệnh
// builder.Services.AddDbContext<AppDbContext>(options =>
// {
//     options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
//     // Bỏ qua cảnh báo PendingModelChanges để chạy ổn định trên Render
//     options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
// });

// var app = builder.Build();


// //đăng ký mqttpublisher 
// builder.Services.AddSingleton<IMqttClient>(sp =>
// {
//     var factory = new MqttFactory();
//     var client = factory.CreateMqttClient();

//     var options = new MqttClientOptionsBuilder()
//         .WithTcpServer("broker.hivemq.com")
//         .Build();

//     client.ConnectAsync(options).Wait();
//     return client;
// });

// builder.Services.AddSingleton<MqttPublisher>();


// // ===================== AUTO MIGRATION & SEED DATA =====================
// using (var scope = app.Services.CreateScope())
// {
//     var services = scope.ServiceProvider;
//     try
//     {
//         var context = services.GetRequiredService<AppDbContext>();
//         context.Database.Migrate();

//         if (!context.Devices.Any())
//         {
//             context.Devices.Add(new Device { name = "ESP32 Lab", type = "ESP32", is_online = true });
//             context.SaveChanges();
//         }
//         Console.WriteLine(">>> smarthome-db và Seed Data đã sẵn sàng!");
//     }
//     catch (Exception ex)
//     {
//         Console.WriteLine($">>> Lỗi Database: {ex.Message}");
//     }
// }

// // ===================== MIDDLEWARE =====================
// app.UseCors("AllowAll");

// if (app.Environment.IsDevelopment() || true)
// {
//     app.MapOpenApi();
//     app.MapScalarApiReference();
// }

// if (!app.Environment.IsProduction())
// {
//     app.UseHttpsRedirection();
// }

// app.UseAuthorization();
// app.MapControllers();
// app.Run();

using Microsoft.EntityFrameworkCore;
using SensorApi.Models;
using SensorApi.Services;
using SensorApi.Realtime;
using MQTTnet;
using MQTTnet.Client;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ===================== 1. CẤU HÌNH DATABASE (Bản Fix lỗi Port và Bỏ qua cảnh báo) =====================
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connString;

if (string.IsNullOrEmpty(databaseUrl))
{
    connString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
}
else
{
    try 
    {
        var databaseUri = new Uri(databaseUrl);
        var userInfo = databaseUri.UserInfo.Split(':');
        int port = databaseUri.Port == -1 ? 5432 : databaseUri.Port;
        connString = $"Host={databaseUri.Host};Port={port};Database={databaseUri.AbsolutePath.Trim('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
        Console.WriteLine($">>> Đã nhận cấu hình từ Render (Port: {port})");
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> Lỗi parse DATABASE_URL: {ex.Message}");
        connString = databaseUrl; 
    }
}

builder.Services.AddDbContext<AppDbContext>(opt => 
{
    opt.UseNpgsql(connString, o => o.EnableRetryOnFailure());
    // --- QUAN TRỌNG: Dòng này giúp bỏ qua lỗi PendingModelChangesWarning ---
    opt.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// ===================== 2. ĐĂNG KÝ CÁC DỊCH VỤ =====================
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddSingleton<IMqttClient>(sp => new MqttFactory().CreateMqttClient());
builder.Services.AddSingleton<MqttPublisher>();
builder.Services.AddHostedService<MqttWorker>();

builder.Services.AddCors(opt => opt.AddPolicy("AllowAll", p => 
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// ===================== 3. TỰ ĐỘNG MIGRATE & SEED DATA =====================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try 
    {
        Console.WriteLine(">>> Đang khởi tạo Database...");
        // Ép buộc chạy Migration
        db.Database.Migrate();

        if (!db.Devices.Any()) {
            db.Devices.Add(new Device { name = "ESP32 Lab", type = "ESP32", is_online = true });
        }

        if (!db.Users.Any()) {
            db.Users.Add(new User { 
                Username = "admin", 
                PasswordHash = "123456", 
                email = "admin@example.com",
                created_at = DateTime.UtcNow
            });
            Console.WriteLine(">>> Đã tạo tài khoản admin/123456");
        }

        db.SaveChanges();
        Console.WriteLine(">>> DATABASE VÀ SEED DATA ĐÃ SẴN SÀNG!");
    } 
    catch (Exception ex) 
    {
        Console.WriteLine($">>> LỖI DATABASE: {ex.Message}");
    }
}

// ===================== 4. MIDDLEWARE =====================
app.UseCors("AllowAll");
app.MapOpenApi();
app.MapScalarApiReference();
app.UseAuthorization();
app.MapControllers();
app.MapHub<SensorHub>("/sensorhub"); 

app.Run();