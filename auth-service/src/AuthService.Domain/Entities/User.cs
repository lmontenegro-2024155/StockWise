using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public class User
{
    [Key]
    [MaxLength(16)]
    public string Id { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [MaxLength(25, ErrorMessage = "El nombre no debe de tener mas de 25 caracteres")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [MaxLength(25, ErrorMessage = "El apellido no debe de tener mas de 25 caracteres")]
    public string Surname { get; set; } = string.Empty;

    [Required(ErrorMessage = "El username es obligatorio")]
    [MaxLength(25, ErrorMessage = "El username no debe de tener mas de 25 caracteres")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "El email es obligatorio")]
    [MaxLength(150, ErrorMessage = "El email no debe de tener mas de 150 caracteres")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MaxLength(50, ErrorMessage = "La contraseña no debe de tener mas de 50 caracteres")]
    [MinLength(8, ErrorMessage = "La contraseña debe de tener al menos 8 caracteres")]
    public string Password { get; set; } = string.Empty;
    public bool Status { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public UserProfile UserProfile { get; set; } = null!;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public UserEmail UserEmail { get; set; } = null!;
    public UserPasswordReset UserPasswordReset { get; set; } = null!;
}
