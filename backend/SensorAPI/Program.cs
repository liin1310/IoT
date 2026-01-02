using Microsoft.EntityFrameworkCore;
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
builder.Services.AddSwaggerGen();

// Đăng ký Background Service nhận dữ liệu MQTT của Thu
builder.Services.AddHostedService<SensorApi.Services.MqttWorker>();

// Cấu hình kết nối PostgreSQL (smarthome-db)
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
        Console.WriteLine(">>> Database smarthome-db đã sẵn sàng!");

        // 2. Tự động tạo thiết bị mặc định nếu chưa có (Để lấy ID tự tăng)
        if (!context.Devices.Any())
        {
            context.Devices.Add(new Device
            {
                name = "ESP32 Trung Tâm",
                type = "ESP32-S3",
                is_online = true
            });
            context.SaveChanges();
            Console.WriteLine(">>> Đã khởi tạo thiết bị mặc định thành công!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> Lỗi cập nhật Database: {ex.Message}");
    }
}

// ===================== MIDDLEWARE =====================
app.UseCors("AllowAll");

// Bật Swagger cho cả Production để nhóm dễ test
app.UseSwagger();
app.UseSwaggerUI();

// KHÔNG dùng HTTPS Redirection trên Render để tránh lỗi vòng lặp
if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();
app.Run();