using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class RegisterInventoryMovementDto
{
    [Required(ErrorMessage = "El producto es obligatorio")]
    public string ProductId { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo de movimiento es obligatorio")]
    [RegularExpression("entry|exit", ErrorMessage = "El tipo debe ser 'entry' o 'exit'")]
    public string Type { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a cero")]
    public int Quantity { get; set; }

    [MaxLength(250, ErrorMessage = "La nota no debe superar los 250 caracteres")]
    public string Note { get; set; } = string.Empty;
}
