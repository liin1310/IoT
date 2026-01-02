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

        // 1. API lấy lịch sử dữ liệu (N.Linh dùng vẽ biểu đồ)
        [HttpGet("history/{type}")]
        public async Task<IActionResult> GetHistory(string type)
        {
            var data = await _context.SensorDataEntries
                .Where(s => s.type == type)
                .OrderByDescending(s => s.received_at)
                .Take(20) // Lấy 20 bản ghi gần nhất
                .ToListAsync();
            return Ok(data);
        }

        // 2. Kiểm tra cháy dựa trên logic WARNING (1.0) của P.Linh
        [HttpGet("check-fire")]
        public async Task<IActionResult> CheckFire()
        {
            var last60Seconds = DateTimeOffset.UtcNow.AddSeconds(-60);

            // Tìm xem có bất kỳ WARNING (1.0) nào trong 60 giây qua không
            var isFire = await _context.SensorDataEntries
                .AnyAsync(s => s.received_at >= last60Seconds
                            && s.type == "FireStatus"
                            && s.value == 1.0);

            return Ok(new { isFire = isFire });
        }

        // 3. API nhận dữ liệu (Dùng để test thủ công qua Postman)
        [HttpPost]
        public async Task<IActionResult> ReceiveData(SensorData data)
        {
            data.received_at = DateTimeOffset.UtcNow;
            _context.SensorDataEntries.Add(data); 
            await _context.SaveChangesAsync();
            return Ok(data);
        }
    }
}