using Microsoft.AspNetCore.Mvc;
using SensorApi.Models;
using SensorApi.Services;
using System.Threading.Tasks;

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
            await _mqtt.PublishAsync("smarthome/light", body.State);
            return Ok(new { message = "Light command sent" });
        }

        [HttpPost("fan")]
        public async Task<IActionResult> ControlFan([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("smarthome/fan", body.State);
            return Ok(new { message = "Fan command sent" });
        }

        [HttpPost("door")]
        public async Task<IActionResult> ControlDoor([FromBody] DeviceCommand body)
        {
            await _mqtt.PublishAsync("smarthome/door", body.State);
            return Ok(new { message = "Door command sent" });
        }

        [HttpPost("alarm/stop")]
        public async Task<IActionResult> StopAlarm()
        {
            await _mqtt.PublishAsync("smarthome/alarm", "OFF");
            return Ok(new { message = "Alarm stopped" });
        }
    }

    public class DeviceCommand
    {
        public string State { get; set; } = ""; // ON / OFF / OPEN / CLOSE
    }
}