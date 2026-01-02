namespace SensorApi.Models
{
    public class SensorData
    {
        public int id { get; set; }

        //FK 
        public int DeviceId { get; set; }

        public string type { get; set; } = "";
        public double value { get; set; }
        public DateTimeOffset received_at { get; set; }

        // Navigation
        public Device Device { get; set; } = null!;
    }
}
