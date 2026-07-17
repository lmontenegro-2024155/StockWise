using System.Security.Claims;
using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class InventoryController(IInventoryService inventoryService) : ControllerBase
{
    private const string SubClaim = "sub";
    private const string NameIdentifierClaim = ClaimTypes.NameIdentifier;

    [HttpPost("movements")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<InventoryMovementResponseDto>> RegisterMovement([FromBody] RegisterInventoryMovementDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetCurrentUserId() ?? "system";
        var result = await inventoryService.RegisterMovementAsync(dto, userId);
        return Ok(result);
    }

    [HttpGet("movements/{productId}")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<IReadOnlyList<InventoryMovementResponseDto>>> GetProductHistory(string productId)
    {
        var result = await inventoryService.GetHistoryByProductAsync(productId);
        return Ok(result);
    }

    [HttpGet("movements")]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<IReadOnlyList<InventoryMovementResponseDto>>> GetRecent([FromQuery] int limit = 20)
    {
        var result = await inventoryService.GetRecentAsync(limit);
        return Ok(result);
    }

    private string? GetCurrentUserId()
    {
        return User.Claims
            .FirstOrDefault(c => c.Type == SubClaim || c.Type == NameIdentifierClaim)
            ?.Value;
    }
}
