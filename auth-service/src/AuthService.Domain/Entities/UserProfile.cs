using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public class UserProfile
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required(ErrorMessage = "El ID del usuario es obligatorio")]
    [MaxLength(16)]
    public string UserId { get; set; } = string.Empty;

    [MaxLength(250)]
    public string ProfilePicture { get; set; } = string.Empty;

    [Required]
    [StringLength(8, MinimumLength = 8, ErrorMessage = "El número de teléfono debe de tener exactamente 8 caracteres")]
    [RegularExpression(@"^\d{8}$", ErrorMessage = "El número de teléfono debe de contener solo números")]
    public string Phone { get; set; } = string.Empty;

    public User User { get; set; } = null!;
}
