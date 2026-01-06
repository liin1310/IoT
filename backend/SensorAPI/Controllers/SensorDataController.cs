using Microsoft.AspNetCore.Mvc;
using SensorApi.Models;
using Microsoft.EntityFrameworkCore;
using FirebaseAdmin.Messaging;

namespace SensorApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SensorDataController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SensorDataController(AppDbContext context) { _context = context; }

        private async Task SendPushToAllHomeDevices(string title, string body)
        {
            // Lấy all các token hiện có trong bảng UserDevices
            var tokens = await _context.UserDevices
                .Select(d => d.FcmToken)
                .ToListAsync();

            if (tokens.Count == 0) return;

            var message = new MulticastMessage()
            {
                Tokens = tokens,
                Notification = new Notification()
                {
                    Title = title,
                    Body = body
                },
                Data = new Dictionary<string, string>() {
                    { "type", "ALARM" },
                    { "click_action", "FLUTTER_NOTIFICATION_CLICK" }
                }
            };

            await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
        }


        [HttpGet("history/{type}")]
        public async Task<IActionResult> GetHistory(string type)
        {
            var data = await _context.SensorDataEntries
                .Where(s => s.type == type)
                .OrderByDescending(s => s.received_at)
                .Take(20)
                .ToListAsync();
            return Ok(data);
        }

        private static bool _lastFireState = false;
        private static DateTime _lastFireNotificationTime = DateTime.MinValue;

        [HttpGet("check-fire")]
        public async Task<IActionResult> CheckFire()
        {
            var last60Seconds = DateTimeOffset.UtcNow.AddSeconds(-60);

            var isFire = await _context.SensorDataEntries
                .AnyAsync(s => s.received_at >= last60Seconds
                            && (
                                (s.type == "FireStatus" && s.value == 1.0) ||
                                (s.type == "Gas" && s.value >= 2000.0)
                               )
                );

            // Gửi FCM notification khi phát hiện cháy (chỉ gửi 1 lần khi chuyển từ false -> true, và không spam quá nhiều)
            if (isFire && !_lastFireState)
            {
                // Chỉ gửi nếu chưa gửi trong 30 giây gần đây (tránh spam)
                if ((DateTime.UtcNow - _lastFireNotificationTime).TotalSeconds > 30)
                {
                    string alertMessage = "Phát hiện hỏa hoạn hoặc nồng độ khí gas nguy hiểm! Kiểm tra ngay lập tức!";
                    await SendPushToAllHomeDevices("🚨 BÁO ĐỘNG KHẨN CẤP", alertMessage);
                    _lastFireNotificationTime = DateTime.UtcNow;
                }
            }

            _lastFireState = isFire;

            return Ok(new { isFire = isFire });
        }

        [HttpPost]
        public async Task<IActionResult> ReceiveData(SensorDataCreateDto dto)
        {
            var data = new SensorData
            {
                DeviceId = dto.DeviceId,
                type = dto.type,
                value = dto.value,
                received_at = DateTimeOffset.UtcNow
            };

            _context.SensorDataEntries.Add(data);
            await _context.SaveChangesAsync();

            bool isDanger = false;
            string alertMessage = "";

            if (dto.type == "FireStatus" && dto.value == 1.0)
            {
                isDanger = true;
                alertMessage = "Phát hiện có CHÁY tại khu vực cảm biến!";
            }
            else if (dto.type == "Gas" && dto.value >= 2000.0)
            {
                isDanger = true;
                alertMessage = $"Cảnh báo: Nồng độ Gas vượt mức nguy hiểm ({dto.value} ppm)!";
            }

            if (isDanger)
            {
                // Gọi hàm gửi cho toàn bộ thiết bị trong nhà
                await SendPushToAllHomeDevices("BÁO ĐỘNG KHẨN CẤP", alertMessage);
            }

            return Ok(data);
        }

        public class SensorDataCreateDto
        {
            public int DeviceId { get; set; }
            public string type { get; set; } = "";
            public double value { get; set; }
        }
    }
}