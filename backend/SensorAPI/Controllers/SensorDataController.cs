using Microsoft.AspNetCore.Mvc;
using SensorApi.Models;
using Microsoft.EntityFrameworkCore;
using FirebaseAdmin;
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
            try
            {
                // Kiểm tra Firebase đã được khởi tạo chưa
                if (FirebaseAdmin.FirebaseApp.DefaultInstance == null)
                {
                    Console.WriteLine(">>> WARNING: Firebase chưa được khởi tạo, không thể gửi FCM");
                    return;
                }

                // Lấy all các token hiện có trong bảng UserDevices
                var tokens = await _context.UserDevices
                    .Where(d => !string.IsNullOrEmpty(d.FcmToken))
                    .Select(d => d.FcmToken)
                    .ToListAsync();

                if (tokens.Count == 0)
                {
                    Console.WriteLine(">>> Không có FCM token nào để gửi");
                    return;
                }

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
                Console.WriteLine($">>> Đã gửi FCM notification tới {tokens.Count} thiết bị");
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> Lỗi gửi FCM notification: {ex.Message}");
                // Không throw exception để tránh crash endpoint
            }
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
            try
            {
                var last60Seconds = DateTimeOffset.UtcNow.AddSeconds(-60);

                var isFire = await _context.SensorDataEntries
                    .AnyAsync(s => s.received_at >= last60Seconds
                                && (
                                    (s.type == "FireStatus" && s.value == 1.0) ||
                                    (s.type == "Gas" && s.value >= 2000.0)
                                   )
                    );

                // Gửi FCM notification khi phát hiện cháy
                // - Gửi ngay khi chuyển từ false -> true (lần đầu)
                // - Gửi định kỳ mỗi 30 giây khi vẫn còn cháy (để đảm bảo user đóng tab vẫn nhận được)
                if (isFire)
                {
                    bool shouldSend = false;
                    
                    // Trường hợp 1: Chuyển từ false -> true (lần đầu phát hiện)
                    if (!_lastFireState)
                    {
                        shouldSend = true;
                    }
                    // Trường hợp 2: Vẫn còn cháy và đã qua 30 giây kể từ lần gửi cuối
                    else if ((DateTime.UtcNow - _lastFireNotificationTime).TotalSeconds > 30)
                    {
                        shouldSend = true;
                    }

                    if (shouldSend)
                    {
                        string alertMessage = "Phát hiện hỏa hoạn hoặc nồng độ khí gas nguy hiểm! Kiểm tra ngay lập tức!";
                        // Gửi FCM trong background, không block response
                        _ = Task.Run(async () => await SendPushToAllHomeDevices("🚨 BÁO ĐỘNG KHẨN CẤP", alertMessage));
                        _lastFireNotificationTime = DateTime.UtcNow;
                    }
                }

                _lastFireState = isFire;

                return Ok(new { isFire = isFire });
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> Lỗi trong CheckFire: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
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