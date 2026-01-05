namespace SensorApi.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = "";
        public string PasswordHash { get; set; } = "";

        public string email { get; set; } = "";
        public DateTime? created_at { get; set; }
        public string? FcmToken { get; set; }
    }
}


