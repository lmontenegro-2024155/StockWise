using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class UpdateUserRoleDto
{
    [Required(ErrorMessage = "El nombre del rol es obligatorio.")]
    [RegularExpression("^(ADMIN_ROLE|USER_ROLE)$",
        ErrorMessage = "Rol inválido.")]
    public string RoleName { get; init; } = string.Empty;
}
