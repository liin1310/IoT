namespace SensorApi.Models
{
    public class SensorData
    {
        public int id { get; set; }
        public int device_id { get; set; } // ID của cảm biến gửi khói/nhiệt độ
        public string type { get; set; } = ""; // "Smoke" hoặc "Temperature"
        public double value { get; set; } = 0.0; // Nồng độ khói đo được
        public DateTimeOffset received_at { get; set; } // Thời điểm nhận dữ liệu

        public virtual Device? Device { get; set; } // Để lấy tên thiết bị khi báo cháy
    }
}
