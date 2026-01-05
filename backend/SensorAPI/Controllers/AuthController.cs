using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using SensorApi.Models; 
using System.Linq;
using Microsoft.EntityFrameworkCore;


namespace SensorApi.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AuthController(AppDbContext db) { _db = db; }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest req)
        {
            if (_db.Users.Any(u => u.Username == req.Username))
                return BadRequest(new { message = "Tài khoản đã tồn tại" });

            var user = new User
            {
                Username = req.Username,
                PasswordHash = req.Password,
                email = req.Email,
                created_at = DateTime.UtcNow
            };

            _db.Users.Add(user);
            _db.SaveChanges();

            return Ok(new { message = "Đăng ký thành công" });
        }


        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var user = _db.Users.SingleOrDefault(u => u.Username == req.Username);
            if (user == null || user.PasswordHash != req.Password)
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });

            return Ok(new { token = "dummy-jwt", username = user.Username });
        }

        [HttpPost("save-fcm-token")]
        public IActionResult SaveFcmToken([FromBody] SaveFcmTokenRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.FcmToken)) return BadRequest();

            // Kiểm tra xem token này đã tồn tại cho user này chưa
            var device = _db.UserDevices.FirstOrDefault(d => d.FcmToken == req.FcmToken && d.Username == req.Username);

            if (device == null)
            {
                _db.UserDevices.Add(new UserDevice
                {
                    Username = req.Username,
                    FcmToken = req.FcmToken
                });
            }
            else
            {
                device.LastUpdated = DateTime.UtcNow;
            }

            _db.SaveChanges();
            return Ok(new { message = "Registered successfully" });
        }

    }

    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
        public string Email { get; set; } = "";
    }

    public class SaveFcmTokenRequest
    {
        public string Username { get; set; } = "";
        public string FcmToken { get; set; } = "";
    }

}