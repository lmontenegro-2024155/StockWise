using System.ComponentModel.DataAnnotations;

namespace AuthService.Application.DTOs;

public class CreateProductDto
{
    [Required(ErrorMessage = "El nombre del producto es obligatorio")]
    [MaxLength(100, ErrorMessage = "El nombre no debe superar los 100 caracteres")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "La descripción no debe superar los 500 caracteres")]
    public string Description { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "El precio debe ser mayor o igual a cero")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "El stock debe ser mayor o igual a cero")]
    public int Stock { get; set; }
}
