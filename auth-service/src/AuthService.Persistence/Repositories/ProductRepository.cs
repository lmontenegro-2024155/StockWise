using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class ProductRepository(ApplicationDbContext context) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync()
    {
        return await context.Products
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(string id)
    {
        return await context.Products.FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
    }

    public async Task<Product> CreateAsync(Product product)
    {
        context.Products.Add(product);
        await context.SaveChangesAsync();
        return product;
    }

    public async Task<Product?> UpdateAsync(Product product)
    {
        context.Products.Update(product);
        await context.SaveChangesAsync();
        return product;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var product = await context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return false;

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return true;
    }
}
