using Microsoft.EntityFrameworkCore;
using SensorApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình CORS để Frontend truy cập được
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Kết nối PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

var app = builder.Build();

// ==========================================================
// 2. ĐOẠN CODE TỰ ĐỘNG UPDATE DATABASE NẰM Ở ĐÂY
// ==========================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        // Lệnh này tương đương "Update-Database" trên máy local
        context.Database.Migrate();
        Console.WriteLine(">>> Database đã được cập nhật tự động thành công!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> Lỗi cập nhật Database: {ex.Message}");
    }
}
// ==========================================================

app.UseCors("AllowAll");

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();