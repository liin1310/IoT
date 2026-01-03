[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    public AuthController(AppDbContext db) => _db = db;

    [HttpPost("login")]
    public IActionResult Login(LoginRequest req)
    {
        var user = _db.Users.SingleOrDefault(u => u.Username == req.Username && u.PasswordHash == req.Password);
        if (user == null) return Unauthorized(new { message = "Sai tài khoản" });
        return Ok(new { token = "jwt-token-logic-here", username = user.Username });
    }
}