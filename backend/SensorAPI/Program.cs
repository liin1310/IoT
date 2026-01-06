using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;
using MQTTnet;
using MQTTnet.Client;
using Scalar.AspNetCore;
using SensorApi.Models;
using SensorApi.Realtime;
using SensorApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ===================== KHỞI TẠO FIREBASE (ƯU TIÊN BIẾN MÔI TRƯỜNG) =====================
var firebaseConfigJson = builder.Configuration["FIREBASE_CONFIG"];
var localKeyPath = "firebase_key.json";

try
{
    if (!string.IsNullOrEmpty(firebaseConfigJson))
    {
        // 1. Nếu có biến môi trường trên Render, dùng chuỗi JSON
        FirebaseApp.Create(new AppOptions()
        {
            Credential = GoogleCredential.FromJson(firebaseConfigJson)
        });
        Console.WriteLine(">>> Firebase initialized via Environment Variable.");
    }
    else if (File.Exists(localKeyPath))
    {
        // 2. Nếu không có biến môi trường nhưng có file (Local), dùng file
        FirebaseApp.Create(new AppOptions()
        {
            Credential = GoogleCredential.FromFile(localKeyPath)
        });
        Console.WriteLine(">>> Firebase initialized via local firebase_key.json.");
    }
    else
    {
        Console.WriteLine(">>> WARNING: No Firebase configuration found. Push notifications will be disabled.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($">>> FIREBASE INIT ERROR: {ex.Message}");
}


// ===================== 1. DATABASE =====================

builder.Services.AddDbContext<AppDbContext>(opt =>
{
    opt.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.EnableRetryOnFailure()
    );

    opt.ConfigureWarnings(w =>
        w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)
    );
});

// SERVICES 
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// MQTT
builder.Services.AddSingleton<IMqttClient>(sp =>
    new MqttFactory().CreateMqttClient()
);
builder.Services.AddSingleton<MqttPublisher>();
builder.Services.AddHostedService<MqttWorker>();

// CORS
builder.Services.AddCors(opt =>
    opt.AddPolicy("AllowAll", p =>
        p.AllowAnyOrigin()
         .AllowAnyMethod()
         .AllowAnyHeader()
    )
);

var app = builder.Build();

// INIT DATABASE & SEED 
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var db = services.GetRequiredService<AppDbContext>();

    try
    {
        Console.WriteLine(">>> Đang kiểm tra và cập nhật Database...");
        db.Database.Migrate();

        bool hasChanges = false;

        if (!db.Devices.Any())
        {
            Console.WriteLine(">>> Đang tạo dữ liệu mẫu cho Devices...");
            db.Devices.Add(new Device
            {
                name = "ESP32 Lab",
                type = "ESP32",
                is_online = true
            });
            hasChanges = true;
        }

        if (!db.Users.Any())
        {
            Console.WriteLine(">>> Đang tạo dữ liệu mẫu cho Users...");
            db.Users.Add(new User
            {
                Username = "admin",
                PasswordHash = "123456",
                email = "admin@example.com",
                created_at = DateTime.UtcNow
            });
            hasChanges = true;
        }

        if (hasChanges)
        {
            db.SaveChanges();
            Console.WriteLine(">>> Đã nạp dữ liệu mẫu thành công!");
        }

        Console.WriteLine(">>> Database đã sẵn sàng!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> LỖI DATABASE: {ex.Message}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($">>> Chi tiết: {ex.InnerException.Message}");
        }
    }
}

// MIDDLEWARE 
app.UseCors("AllowAll");
app.MapOpenApi();
app.MapScalarApiReference();
app.UseAuthorization();
app.MapControllers();

// SignalR
app.MapHub<SensorHub>("/sensorhub");

app.Run();