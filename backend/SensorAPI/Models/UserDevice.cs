namespace SensorApi.Models
{
    public class UserDevice
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string FcmToken { get; set; } = "";
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}