using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ReportsController(IReportsService reportsService) : ControllerBase
{
    [HttpGet("low-stock")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<IReadOnlyList<ProductResponseDto>>> GetLowStock([FromQuery] int threshold = 10)
    {
        var result = await reportsService.GetLowStockProductsAsync(threshold);
        return Ok(result);
    }

    [HttpGet("summary")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<InventorySummaryReportDto>> GetSummary([FromQuery] int threshold = 10)
    {
        var result = await reportsService.GetInventorySummaryAsync(threshold);
        return Ok(result);
    }
}
