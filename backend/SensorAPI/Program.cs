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

// 1. Database - Tự động nhận DATABASE_URL trên Render hoặc dùng local
var connString = Environment.GetEnvironmentVariable("DATABASE_URL") 
                 ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(connString));

// 2. Services
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// MQTT & Worker
builder.Services.AddSingleton<IMqttClient>(sp => new MqttFactory().CreateMqttClient());
builder.Services.AddSingleton<MqttPublisher>();
builder.Services.AddHostedService<MqttWorker>();

// 3. CORS
builder.Services.AddCors(opt => opt.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// 4. Migrate Database tự động & SEED DATA
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try {
        db.Database.Migrate();

        // Tạo thiết bị mẫu nếu chưa có
        if (!db.Devices.Any()) {
            db.Devices.Add(new Device { name = "ESP32 Lab", type = "ESP32", is_online = true });
        }

        // --- QUAN TRỌNG: Tạo tài khoản mẫu để test Login ---
        if (!db.Users.Any()) {
            db.Users.Add(new User { 
                Username = "admin", 
                PasswordHash = "123456", // Password để bạn test
                email = "admin@example.com",
                created_at = DateTime.UtcNow
            });
            Console.WriteLine(">>> Đã tạo tài khoản admin mặc định (Pass: 123456)");
        }

        db.SaveChanges();
        Console.WriteLine(">>> Database và Seed Data đã sẵn sàng!");
    } catch (Exception ex) {
        Console.WriteLine($">>> Lỗi Database: {ex.Message}");
    }
}

// 5. Middleware
app.UseCors("AllowAll");
app.MapOpenApi();
app.MapScalarApiReference();
app.MapControllers();
app.MapHub<SensorHub>("/sensorhub"); // Endpoint cho Realtime

app.Run();