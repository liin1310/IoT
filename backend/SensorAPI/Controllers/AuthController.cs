using Microsoft.AspNetCore.Mvc;
using SensorApi.Models; // Quan trọng để thấy AppDbContext
using System.Linq;

namespace SensorApi.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AuthController(AppDbContext db) { _db = db; }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            var user = _db.Users.SingleOrDefault(u => u.Username == req.Username);
            if (user == null || user.PasswordHash != req.Password)
                return Unauthorized(new { message = "Sai tài khoản hoặc mật khẩu" });

            return Ok(new { token = "dummy-jwt", username = user.Username });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}