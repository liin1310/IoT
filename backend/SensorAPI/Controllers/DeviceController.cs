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
using SensorApi.Services;
using SensorApi.Realtime;

namespace SensorApi.Controllers
{
    [ApiController]
    [Route("api/device")]
    public class DeviceController : ControllerBase
    {
        private readonly MqttPublisher _mqtt;
        private readonly IHubContext<SensorHub> _hubContext; // Thêm SignalR

        public DeviceController(MqttPublisher mqtt, IHubContext<SensorHub> hubContext)
        {
            _mqtt = mqtt;
            _hubContext = hubContext;
        }

        [HttpPost("light")]
        public async Task<IActionResult> ControlLight([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("home/cmd/light", body.State);
            
            // Thông báo cho Frontend cập nhật trạng thái icon ngay lập tức
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "light", state = body.State });
            
            return Ok(new { message = "Light command sent" });
        }

        [HttpPost("fan")]
        public async Task<IActionResult> ControlFan([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("home/cmd/fan", body.State);
            
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "fan", state = body.State });
            
            return Ok(new { message = "Fan command sent" });
        }

        [HttpPost("door")]
        public async Task<IActionResult> ControlDoor([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("home/cmd/door", body.State);
            
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "door", state = body.State });
            
            return Ok(new { message = "Door command sent" });
        }

        [HttpPost("alarm/stop")]
        public async Task<IActionResult> StopAlarm()
        {
            await _mqtt.PublishAsync("home/cmd/alarm", "OFF");
            
            await _hubContext.Clients.All.SendAsync("DeviceStatusChanged", new { device = "alarm", state = "OFF" });
            
            return Ok(new { message = "Alarm stop command sent" });
        }
    }

    public class DeviceCommand { public string State { get; set; } = ""; }
}