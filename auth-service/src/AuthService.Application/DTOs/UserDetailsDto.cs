namespace AuthService.Application.DTOs;

public class UserDetailsDto
{
    public string Id { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string? ProfilePicture { get; init; }
    public string Role { get; init; } = string.Empty;
}
