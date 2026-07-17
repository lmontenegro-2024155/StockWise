namespace AuthService.Application.DTOs;

public class AuthResponseDto
{
    public bool Success { get; init; } = true;
    public string Message { get; init; } = string.Empty;
    public string Token { get; init; } = string.Empty;
    public UserDetailsDto UserDetails { get; init; } = new();

    public DateTime ExpiresAt { get; init; }
}