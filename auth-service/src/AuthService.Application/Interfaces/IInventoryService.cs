using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IInventoryService
{
    Task<InventoryMovementResponseDto> RegisterMovementAsync(RegisterInventoryMovementDto dto, string createdBy);
    Task<IReadOnlyList<InventoryMovementResponseDto>> GetHistoryByProductAsync(string productId);
    Task<IReadOnlyList<InventoryMovementResponseDto>> GetRecentAsync(int limit = 20);
}
