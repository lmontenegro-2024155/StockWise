using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using MongoDB.Driver;

namespace AuthService.Persistence.Repositories;

public class MongoProductRepository(IMongoDatabase database) : IProductRepository
{
    private readonly IMongoCollection<Product> _collection = database.GetCollection<Product>("products");

    public async Task<IReadOnlyList<Product>> GetAllAsync()
    {
        return await _collection
            .Find(p => p.IsActive)
            .SortBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<Product?> GetByIdAsync(string id)
    {
        return await _collection
            .Find(p => p.Id == id && p.IsActive)
            .FirstOrDefaultAsync();
    }

    public async Task<Product> CreateAsync(Product product)
    {
        await _collection.InsertOneAsync(product);
        return product;
    }

    public async Task<Product?> UpdateAsync(Product product)
    {
        var result = await _collection.ReplaceOneAsync(
            p => p.Id == product.Id && p.IsActive,
            product);

        return result.ModifiedCount > 0 ? product : null;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var update = Builders<Product>.Update
            .Set(p => p.IsActive, false)
            .Set(p => p.UpdatedAt, DateTime.UtcNow);

        var result = await _collection.UpdateOneAsync(
            p => p.Id == id && p.IsActive,
            update);

        return result.ModifiedCount > 0;
    }
}
