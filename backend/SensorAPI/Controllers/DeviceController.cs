[ApiController]
[Route("api/device")]
public class DeviceController : ControllerBase
{
    private readonly MqttPublisher _mqtt;
    public DeviceController(MqttPublisher mqtt) => _mqtt = mqtt;

    [HttpPost("{name}")] // name: light, fan, door
    public async Task<IActionResult> Control(string name, [FromBody] DeviceCommand body)
    {
        await _mqtt.PublishAsync($"smarthome/{name}", body.State);
        return Ok(new { message = $"{name} command sent: {body.State}" });
    }

    [HttpPost("alarm/stop")]
    public async Task<IActionResult> StopAlarm()
    {
        await _mqtt.PublishAsync("smarthome/alarm", "OFF");
        return Ok(new { message = "Alarm stopped" });
    }
}