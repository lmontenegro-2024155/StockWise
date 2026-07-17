using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;

namespace AuthService.Application.Services;

public class InventoryService(
    IProductRepository productRepository,
    IInventoryMovementRepository inventoryMovementRepository) : IInventoryService
{
    public async Task<InventoryMovementResponseDto> RegisterMovementAsync(RegisterInventoryMovementDto dto, string createdBy)
    {
        var normalizedType = dto.Type.Trim().ToLowerInvariant();
        if (normalizedType is not "entry" and not "exit")
        {
            throw new InvalidOperationException("Tipo de movimiento invalido");
        }

        var product = await productRepository.GetByIdAsync(dto.ProductId)
            ?? throw new InvalidOperationException("Producto no encontrado");

        var previousStock = product.Stock;
        var newStock = normalizedType == "entry"
            ? previousStock + dto.Quantity
            : previousStock - dto.Quantity;

        if (newStock < 0)
        {
            throw new InvalidOperationException("No hay existencias suficientes para registrar la salida");
        }

        product.Stock = newStock;
        product.UpdatedAt = DateTime.UtcNow;

        var updatedProduct = await productRepository.UpdateAsync(product);
        if (updatedProduct is null)
        {
            throw new InvalidOperationException("No se pudo actualizar el stock del producto");
        }

        var movement = new InventoryMovement
        {
            Id = UuidGenerator.GenerateInventoryMovementId(),
            ProductId = product.Id,
            ProductName = product.Name,
            Type = normalizedType,
            Quantity = dto.Quantity,
            PreviousStock = previousStock,
            NewStock = newStock,
            Note = dto.Note,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow
        };

        var saved = await inventoryMovementRepository.CreateAsync(movement);
        return Map(saved);
    }

    public async Task<IReadOnlyList<InventoryMovementResponseDto>> GetHistoryByProductAsync(string productId)
    {
        var list = await inventoryMovementRepository.GetByProductIdAsync(productId);
        return list.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<InventoryMovementResponseDto>> GetRecentAsync(int limit = 20)
    {
        var list = await inventoryMovementRepository.GetRecentAsync(limit);
        return list.Select(Map).ToList();
    }

    private static InventoryMovementResponseDto Map(InventoryMovement movement) => new()
    {
        Id = movement.Id,
        ProductId = movement.ProductId,
        ProductName = movement.ProductName,
        Type = movement.Type,
        Quantity = movement.Quantity,
        PreviousStock = movement.PreviousStock,
        NewStock = movement.NewStock,
        Note = movement.Note,
        CreatedBy = movement.CreatedBy,
        CreatedAt = movement.CreatedAt
    };
}
