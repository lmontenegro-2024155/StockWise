using AuthService.Application.DTOs;

namespace AuthService.Application.Interfaces;

public interface IServiceStatusClient
{
    Task<IReadOnlyList<ServiceStatusDto>> GetServicesStatusAsync(CancellationToken cancellationToken = default);
}
