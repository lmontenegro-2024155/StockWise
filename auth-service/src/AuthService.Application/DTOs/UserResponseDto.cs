namespace AuthService.Application.DTOs;

public class UserResponseDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Surname { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? ProfilePicture { get; init; }
    public string Phone { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool Status { get; init; }
    public bool IsEmailVerified { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
