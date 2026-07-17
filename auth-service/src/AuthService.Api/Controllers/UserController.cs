using System.Security.Claims;
using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AuthService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class UsersController(IUserManagementService userManagementService) : ControllerBase
{
    private const string SubClaim = "sub";
    private const string NameIdentifierClaim = ClaimTypes.NameIdentifier;

    private async Task<bool> CurrentUserIsAdmin()
    {
        var userId = User.Claims
            .FirstOrDefault(c =>
                c.Type == SubClaim ||
                c.Type == NameIdentifierClaim)?.Value;

        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var roles = await userManagementService.GetUserRolesAsync(userId);
        return roles.Contains(RoleConstants.ADMIN_ROLE);
    }

    [HttpPut("{userId}/role")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<UserResponseDto>> UpdateUserRole(
        string userId,
        [FromBody] UpdateUserRoleDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (!await CurrentUserIsAdmin())
            return Forbid();

        var result = await userManagementService
            .UpdateUserRoleAsync(userId, dto.RoleName);

        return Ok(result);
    }

    [HttpGet("{userId}/roles")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<string>>> GetUserRoles(string userId)
    {
        var roles = await userManagementService.GetUserRolesAsync(userId);
        return Ok(roles);
    }

    [HttpGet("by-role/{roleName}")]
    [Authorize]
    [EnableRateLimiting("ApiPolicy")]
    public async Task<ActionResult<IReadOnlyList<UserResponseDto>>> GetUsersByRole(string roleName)
    {
        if (!await CurrentUserIsAdmin())
            return Forbid();

        var users = await userManagementService.GetUsersByRoleAsync(roleName);
        return Ok(users);
    }
}
