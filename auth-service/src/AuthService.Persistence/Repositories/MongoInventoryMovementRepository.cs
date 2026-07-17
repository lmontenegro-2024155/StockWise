using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using MongoDB.Driver;

namespace AuthService.Persistence.Repositories;

public class MongoInventoryMovementRepository(IMongoDatabase database) : IInventoryMovementRepository
{
    private readonly IMongoCollection<InventoryMovement> _collection = database.GetCollection<InventoryMovement>("inventory_movements");

    public async Task<InventoryMovement> CreateAsync(InventoryMovement movement)
    {
        await _collection.InsertOneAsync(movement);
        return movement;
    }

    public async Task<IReadOnlyList<InventoryMovement>> GetByProductIdAsync(string productId)
    {
        return await _collection
            .Find(m => m.ProductId == productId)
            .SortByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<InventoryMovement>> GetRecentAsync(int limit = 20)
    {
        return await _collection
            .Find(Builders<InventoryMovement>.Filter.Empty)
            .SortByDescending(m => m.CreatedAt)
            .Limit(limit)
            .ToListAsync();
    }
}
