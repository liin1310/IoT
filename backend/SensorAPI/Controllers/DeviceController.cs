// using Microsoft.AspNetCore.Mvc;
// using SensorApi.Services;

// namespace SensorApi.Controllers
// {
//     [ApiController]
//     [Route("api/device")]
//     public class DeviceController : ControllerBase
//     {
//         private readonly MqttPublisher _mqtt;
//         public DeviceController(MqttPublisher mqtt) { _mqtt = mqtt; }

//         [HttpPost("light")]
//         public async Task<IActionResult> ControlLight([FromBody] DeviceCommand body)
//         {
//             // Sửa lại thành home/cmd/light để khớp ESP32
//             await _mqtt.PublishAsync("home/cmd/light", body.State);
//             return Ok(new { message = "Light command sent" });
//         }

//         [HttpPost("fan")]
//         public async Task<IActionResult> ControlFan([FromBody] DeviceCommand body)
//         {
//             // Sửa lại thành home/cmd/fan
//             await _mqtt.PublishAsync("home/cmd/fan", body.State);
//             return Ok(new { message = "Fan command sent" });
//         }

//         [HttpPost("door")]
//         public async Task<IActionResult> ControlDoor([FromBody] DeviceCommand body)
//         {
//             // Sửa lại thành home/cmd/door
//             await _mqtt.PublishAsync("home/cmd/door", body.State);
//             return Ok(new { message = "Door command sent" });
//         }

//         [HttpPost("alarm/stop")]
//         public async Task<IActionResult> StopAlarm()
//         {
//             // Sửa lại thành home/cmd/alarm
//             await _mqtt.PublishAsync("home/cmd/alarm", "OFF");
//             return Ok(new { message = "Alarm stop command sent" });
//         }
//     }

//     public class DeviceCommand { public string State { get; set; } = ""; }
// }
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SensorApi.Services;
using SensorApi.Realtime;
using SensorApi.Models;

namespace SensorApi.Controllers
{
    [ApiController]
    [Route("api/device")]
    public class DeviceController : ControllerBase
    {
        private readonly MqttPublisher _mqtt;
        private readonly IHubContext<SensorHub> _hubContext; 
        private readonly AppDbContext _context;

        public DeviceController(MqttPublisher mqtt, IHubContext<SensorHub> hubContext, AppDbContext contextcd )
        {
            _mqtt = mqtt;
            _hubContext = hubContext;
            _context = context;
        }

        // Helper method để lưu trạng thái vào database
        private async Task SaveDeviceStatusToDatabase(string type, string state)
        {
            try
            {
                // Lấy device đầu tiên (ESP32 mặc định)
                var device = await _context.Devices.OrderBy(d => d.id).FirstOrDefaultAsync();
                if (device == null) return;

                // Convert state string (ON/OFF) sang value (1.0/0.0)
                double value = (state == "ON") ? 1.0 : 0.0;

                var statusEntry = new SensorData
                {
                    DeviceId = device.id,
                    type = type,
                    value = value,
                    received_at = DateTimeOffset.UtcNow
                };

                _context.SensorDataEntries.Add(statusEntry);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($">>> Đã lưu {type} = {state} vào database");
            }
            catch (Exception ex)
            {
                Console.WriteLine($">>> Lỗi lưu {type} status: {ex.Message}");
            }
        }

        //API để điều khiển đèn
        [HttpPost("light")]
        public async Task<IActionResult> ControlLight([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("home/cmd/light", body.State);
            
            // Lưu trạng thái vào database ngay để polling có thể lấy được
            await SaveDeviceStatusToDatabase("LightStatus", body.State);
            
            // Thông báo cho Frontend cập nhật trạng thái icon ngay lập tức (nếu dùng SignalR)
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "light", state = body.State });
            
            return Ok(new { message = "Light command sent" });
        }


        //API để điều khiển quạt
        [HttpPost("fan")]
        public async Task<IActionResult> ControlFan([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("home/cmd/fan", body.State);
            
            // Lưu trạng thái vào database ngay để polling có thể lấy được
            await SaveDeviceStatusToDatabase("FanStatus", body.State);
            
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "fan", state = body.State });
            
            return Ok(new { message = "Fan command sent" });
        }

        //API để điều khiển cửa
        [HttpPost("door")]
        public async Task<IActionResult> ControlDoor([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("home/cmd/door", body.State);
            
            // Lưu trạng thái vào database ngay để polling có thể lấy được
            await SaveDeviceStatusToDatabase("DoorStatus", body.State);
            
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "door", state = body.State });
            
            return Ok(new { message = "Door command sent" });
        }

        //API để tắt chuông báo động
        [HttpPost("alarm/stop")]
        public async Task<IActionResult> StopAlarm()
        {
            await _mqtt.PublishAsync("home/cmd/alarm", "OFF");
            
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "alarm", state = "OFF" });
            
            return Ok(new { message = "Alarm stop command sent" });
        }

        //API để lấy trạng thái hiện tại của các thiết bị
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            // Tìm các trạng thái mới nhất của Light, Fan, Door, Fire
            var statusTypes = new[] { "LightStatus", "FanStatus", "DoorStatus", "FireStatus" };

            var latestStatuses = await _context.SensorDataEntries
                .Where(s => statusTypes.Contains(s.type))
                .GroupBy(s => s.type)
                .Select(g => g.OrderByDescending(x => x.received_at).FirstOrDefault())
                .ToListAsync();

            // Trả về danh sách trạng thái để Frontend hiển thị nút gạt cho đúng
            return Ok(latestStatuses);
        }
    }

    public class DeviceCommand { public string State { get; set; } = ""; }
}