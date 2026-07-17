namespace AuthService.Application.DTOs;

public class ServiceStatusDto
{
    public string Service { get; set; } = string.Empty;
    public string Status { get; set; } = "unknown";
    public bool Reachable { get; set; }
    public string? Message { get; set; }
}
