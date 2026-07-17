using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class GetProfileByIdDto
{
    [Required(ErrorMessage = "El userId es requerido.")]
    [MaxLength(100)]
    public string UserId { get; init; } = string.Empty;
}
