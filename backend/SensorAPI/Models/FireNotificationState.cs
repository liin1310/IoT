namespace SensorApi.Models
{
    // Model để lưu trạng thái gửi notification cháy (thay vì static variables)
    public class FireNotificationState
    {
        public int Id { get; set; } = 1; // Chỉ có 1 record
        public bool LastFireState { get; set; } = false;
        public DateTime LastFireNotificationTime { get; set; } = DateTime.MinValue;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

