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

// PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

var app = builder.Build();

// ===================== AUTO MIGRATION =====================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();
        Console.WriteLine(">>> Database đã được cập nhật tự động thành công!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($">>> Lỗi cập nhật Database: {ex.Message}");
    }
}

// ===================== MIDDLEWARE =====================
app.UseCors("AllowAll");

//Bật Swagger cho cả Production
app.UseSwagger();
app.UseSwaggerUI();

//KHÔNG dùng HTTPS Redirection trên Render
if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();
app.Run();
