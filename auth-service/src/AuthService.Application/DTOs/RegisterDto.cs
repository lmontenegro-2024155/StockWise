using System.ComponentModel.DataAnnotations;
using AuthService.Application.Interfaces;

namespace AuthService.Application.DTOs;

public class RegisterDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El nombre no puede superar los 50 caracteres.")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [MaxLength(50, ErrorMessage = "El apellido no puede superar los 50 caracteres.")]
    public string Surname { get; init; } = string.Empty;

    [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
    [MinLength(4)]
    [MaxLength(25)]
    public string Username { get; init; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "Formato de correo inválido.")]
    [MaxLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El teléfono debe contener exactamente 8 dígitos.")]
    public string Phone { get; init; } = string.Empty;

    public IFileData? ProfilePicture { get; init; }
}
