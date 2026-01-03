using Microsoft.AspNetCore.Mvc;
using SensorApi.Services;

namespace SensorApi.Controllers
{
    [ApiController]
    [Route("api/device")]
    public class DeviceController : ControllerBase
    {
        private readonly MqttPublisher _mqtt;
        public DeviceController(MqttPublisher mqtt) { _mqtt = mqtt; }

        [HttpPost("light")]
        public async Task<IActionResult> ControlLight([FromBody] DeviceCommand body)
        {
            // Sửa lại thành home/cmd/light để khớp ESP32
            await _mqtt.PublishAsync("home/cmd/light", body.State);
            return Ok(new { message = "Light command sent" });
        }

        [HttpPost("fan")]
        public async Task<IActionResult> ControlFan([FromBody] DeviceCommand body)
        {
            // Sửa lại thành home/cmd/fan
            await _mqtt.PublishAsync("home/cmd/fan", body.State);
            return Ok(new { message = "Fan command sent" });
        }

        [HttpPost("door")]
        public async Task<IActionResult> ControlDoor([FromBody] DeviceCommand body)
        {
            // Sửa lại thành home/cmd/door
            await _mqtt.PublishAsync("home/cmd/door", body.State);
            return Ok(new { message = "Door command sent" });
        }

        [HttpPost("alarm/stop")]
        public async Task<IActionResult> StopAlarm()
        {
            // Sửa lại thành home/cmd/alarm
            await _mqtt.PublishAsync("home/cmd/alarm", "OFF");
            return Ok(new { message = "Alarm stop command sent" });
        }
    }

    public class DeviceCommand { public string State { get; set; } = ""; }
}