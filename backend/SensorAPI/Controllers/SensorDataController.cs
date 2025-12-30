using Microsoft.AspNetCore.Mvc;
using SensorApi.Models;
using Microsoft.EntityFrameworkCore;


namespace SensorApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SensorDataController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SensorDataController(AppDbContext context) { _context = context; }

        // nhận dữ liệu từ cảm biến khói
        [HttpPost]
        public async Task<IActionResult> ReceiveData(SensorData data)
        {
            data.received_at = DateTimeOffset.UtcNow;// Tự động lấy giờ hệ thống
            _context.SensorDataEntries.Add(data); 
             await _context.SaveChangesAsync(); 
        return Ok(data);
        }

        //Kiểm tra cháy trong vòng 60 giây gần nhất
        [HttpGet("check-fire")]
        public async Task<IActionResult> GetRecentData()
        {
            var last60Seconds = DateTimeOffset.UtcNow.AddSeconds(-60);
            var fireData = await _context.SensorDataEntries
            .Include(s => s.Device) // Lấy kèm tên thiết bị 
            .Where(s => s.received_at >= last60Seconds && s.type == "Smoke")
            .ToListAsync();
            return Ok(fireData);
        }
    }
}
