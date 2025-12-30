namespace SensorApi.Models
{
    public class Device
    {
        public int id { get; set; }
        public string name { get; set; } = ""; // "Đèn phòng khách", "Quạt", "Cảm biến khói"
        public string type { get; set; } = ""; // "Relay", "Sensor"
        public bool is_online { get; set; } = false;
    }
}
