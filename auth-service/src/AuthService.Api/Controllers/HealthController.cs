using Microsoft.AspNetCore.Mvc;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class HealthController : ControllerBase
{
    private const string ServiceName = "StockWise AuthService";

    [HttpGet]
    public ActionResult<object> GetHealth()
    {
        var response = new
        {
            status = "Healthy",
            timestamp = DateTime.UtcNow,
            service = ServiceName
        };

        return Ok(response);
    }
}
