using AuthService.Domain.Entities;

namespace AuthService.Domain.Interfaces;

public interface IInventoryMovementRepository
{
    Task<InventoryMovement> CreateAsync(InventoryMovement movement);
    Task<IReadOnlyList<InventoryMovement>> GetByProductIdAsync(string productId);
    Task<IReadOnlyList<InventoryMovement>> GetRecentAsync(int limit = 20);
}
