namespace AuthService.Application.DTOs;

public class InventorySummaryReportDto
{
    public DateTime GeneratedAt { get; set; }
    public int TotalProducts { get; set; }
    public int LowStockCount { get; set; }
    public IReadOnlyList<ProductResponseDto> LowStockProducts { get; set; } = [];
    public IReadOnlyList<InventoryMovementResponseDto> RecentMovements { get; set; } = [];
    public IReadOnlyList<ServiceStatusDto> Services { get; set; } = [];
}
