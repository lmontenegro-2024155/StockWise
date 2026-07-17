using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Application.Services;

namespace AuthService.Application.Services;

public class ProductService(IProductRepository productRepository) : IProductService
{
    public async Task<IReadOnlyList<ProductResponseDto>> GetAllAsync()
    {
        var products = await productRepository.GetAllAsync();
        return products.Select(MapToResponse).ToList();
    }

    public async Task<ProductResponseDto?> GetByIdAsync(string id)
    {
        var product = await productRepository.GetByIdAsync(id);
        return product is null ? null : MapToResponse(product);
    }

    public async Task<ProductResponseDto> CreateAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Id = UuidGenerator.GenerateProductId(),
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            IsActive = true
        };

        var created = await productRepository.CreateAsync(product);
        return MapToResponse(created);
    }

    public async Task<ProductResponseDto?> UpdateAsync(string id, UpdateProductDto dto)
    {
        var existing = await productRepository.GetByIdAsync(id);
        if (existing is null)
            return null;

        existing.Name = dto.Name;
        existing.Description = dto.Description;
        existing.Price = dto.Price;
        existing.Stock = dto.Stock;
        existing.IsActive = dto.IsActive;
        existing.UpdatedAt = DateTime.UtcNow;

        var updated = await productRepository.UpdateAsync(existing);
        return updated is null ? null : MapToResponse(updated);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        return await productRepository.DeleteAsync(id);
    }

    public async Task<IReadOnlyList<ProductResponseDto>> GetLowStockAsync(int threshold)
    {
        var products = await productRepository.GetAllAsync();
        return products
            .Where(p => p.Stock <= threshold)
            .Select(MapToResponse)
            .ToList();
    }

    private static ProductResponseDto MapToResponse(Product product) => new()
    {
        Id = product.Id,
        Name = product.Name,
        Description = product.Description,
        Price = product.Price,
        Stock = product.Stock,
        IsActive = product.IsActive,
        CreatedAt = product.CreatedAt,
        UpdatedAt = product.UpdatedAt
    };
}
