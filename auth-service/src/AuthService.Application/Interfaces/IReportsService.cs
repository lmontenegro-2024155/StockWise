using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IReportsService
{
    Task<IReadOnlyList<ProductResponseDto>> GetLowStockProductsAsync(int threshold);
    Task<InventorySummaryReportDto> GetInventorySummaryAsync(int lowStockThreshold = 10);
}
