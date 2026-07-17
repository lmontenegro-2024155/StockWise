using System.ComponentModel.DataAnnotations;

namespace AuthService.Domain.Entities;

public class UserPasswordReset
{
    [Key]
    [MaxLength(16)]
    public string Id {get; set;} = string.Empty;
    [Required]
    [MaxLength(16)]
    public string UserId {get; set;} = string.Empty;

    public string? PasswordResetToken {get; set;}

    public DateTime? PasswordResetTokenExpiry {get; set;}

    public User User {get; set;} = null!;
}