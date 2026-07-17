using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IProductService
{
    Task<IReadOnlyList<ProductResponseDto>> GetAllAsync();
    Task<ProductResponseDto?> GetByIdAsync(string id);
    Task<ProductResponseDto> CreateAsync(CreateProductDto dto);
    Task<ProductResponseDto?> UpdateAsync(string id, UpdateProductDto dto);
    Task<bool> DeleteAsync(string id);
    Task<IReadOnlyList<ProductResponseDto>> GetLowStockAsync(int threshold);
}
