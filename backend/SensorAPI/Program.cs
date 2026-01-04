using Microsoft.EntityFrameworkCore;
using SensorApi.Models;
using SensorApi.Services;
using SensorApi.Realtime;
using MQTTnet;
using MQTTnet.Client;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ===================== 1. DATABASE =====================

// - appsettings.Development.json (local)
// - Environment Variable: ConnectionStrings__DefaultConnection (Render)
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

// ===================== 2. SERVICES =====================
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

// ===================== 3. INIT DATABASE & SEED =====================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        Console.WriteLine(">>> Checking database...");

        // Tạo database nếu chưa có
        db.Database.EnsureCreated();

        // Áp dụng các migration còn thiếu
        db.Database.Migrate();

        if (!db.Devices.Any())
        {
            db.Devices.Add(new Device
            {
                name = "ESP32 Lab",
                type = "ESP32",
                is_online = true
            });
        }

        if (!db.Users.Any())
        {
            db.Users.Add(new User
            {
                Username = "admin",
                PasswordHash = "123456",
                email = "admin@example.com",
                created_at = DateTime.UtcNow
            });
        }

        db.SaveChanges();
        Console.WriteLine(">>> Database ready!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> Database error: {ex.Message}");
    }
}

// ===================== 4. MIDDLEWARE =====================
app.UseCors("AllowAll");

app.MapOpenApi();
app.MapScalarApiReference();

app.UseAuthorization();
app.MapControllers();

// SignalR
app.MapHub<SensorHub>("/sensorhub");

app.Run();
