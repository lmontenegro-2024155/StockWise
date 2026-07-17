using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class LoginDto
{
    [Required(ErrorMessage = "El correo o nombre de usuario es obligatorio.")]
    [MaxLength(256)]
    public string EmailOrUsername { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;
}
