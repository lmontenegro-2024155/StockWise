namespace AuthService.Application.DTOs;

public class RegisterResponseDto
{
    public bool Success { get; init; }

    public UserResponseDto? User { get; init; }

    public string Message { get; init; } = string.Empty;

    public bool EmailVerificationRequired { get; init; }
}
