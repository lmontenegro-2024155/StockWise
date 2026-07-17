using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(string id);
    Task<Product> CreateAsync(Product product);
    Task<Product?> UpdateAsync(Product product);
    Task<bool> DeleteAsync(string id);
}
