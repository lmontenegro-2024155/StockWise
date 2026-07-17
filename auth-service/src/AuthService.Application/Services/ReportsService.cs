using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;

namespace AuthService.Application.Services;

public class ReportsService(
    IProductService productService,
    IInventoryService inventoryService,
    IServiceStatusClient serviceStatusClient) : IReportsService
{
    public async Task<IReadOnlyList<ProductResponseDto>> GetLowStockProductsAsync(int threshold)
    {
        return await productService.GetLowStockAsync(threshold);
    }

    public async Task<InventorySummaryReportDto> GetInventorySummaryAsync(int lowStockThreshold = 10)
    {
        var products = await productService.GetAllAsync();
        var lowStock = await productService.GetLowStockAsync(lowStockThreshold);
        var recentMovements = await inventoryService.GetRecentAsync(20);
        var services = await serviceStatusClient.GetServicesStatusAsync();

        return new InventorySummaryReportDto
        {
            GeneratedAt = DateTime.UtcNow,
            TotalProducts = products.Count,
            LowStockCount = lowStock.Count,
            LowStockProducts = lowStock,
            RecentMovements = recentMovements,
            Services = services
        };
    }
}
