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

        //API lấy lịch sử dữ liệu 
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

        //Kiểm tra cháy dựa trên logic WARNING (1.0) của P.Linh
        [HttpGet("check-fire")]
        public async Task<IActionResult> CheckFire()
        {
            var last60Seconds = DateTimeOffset.UtcNow.AddSeconds(-60);

            var isFire = await _context.SensorDataEntries
                .AnyAsync(s => s.received_at >= last60Seconds
                            && (
                                (s.type == "FireStatus" && s.value == 1.0) ||
                                (s.type == "Gas" && s.value >= 2000.0) // Thêm điều kiện này
                               )
                );

            return Ok(new { isFire = isFire });
        }

        // API nhận dữ liệu
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