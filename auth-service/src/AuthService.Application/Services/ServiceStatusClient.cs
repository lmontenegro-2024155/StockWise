using System.Text.Json;
using AuthService.Application.DTOs;
using AuthService.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AuthService.Application.Services;

public class ServiceStatusClient(HttpClient httpClient, IConfiguration configuration) : IServiceStatusClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<IReadOnlyList<ServiceStatusDto>> GetServicesStatusAsync(CancellationToken cancellationToken = default)
    {
        var endpoints = new Dictionary<string, string>
        {
            ["service-a"] = configuration["ServiceEndpoints:ServiceA"] ?? "http://localhost:5301/api/v1/service-a/health",
            ["service-b"] = configuration["ServiceEndpoints:ServiceB"] ?? "http://localhost:5302/api/v1/service-b/health"
        };

        var results = new List<ServiceStatusDto>();

        foreach (var endpoint in endpoints)
        {
            results.Add(await GetStatusAsync(endpoint.Key, endpoint.Value, cancellationToken));
        }

        return results;
    }

    private async Task<ServiceStatusDto> GetStatusAsync(string name, string url, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(url, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return new ServiceStatusDto
                {
                    Service = name,
                    Status = "down",
                    Reachable = false,
                    Message = $"HTTP {(int)response.StatusCode}"
                };
            }

            string status = "up";
            try
            {
                using var json = JsonDocument.Parse(content);
                if (json.RootElement.TryGetProperty("status", out var statusProp))
                {
                    status = statusProp.GetString() ?? "up";
                }
            }
            catch
            {
                // Ignore parse errors and keep default status
            }

            return new ServiceStatusDto
            {
                Service = name,
                Status = status,
                Reachable = true,
                Message = "OK"
            };
        }
        catch (Exception ex)
        {
            return new ServiceStatusDto
            {
                Service = name,
                Status = "down",
                Reachable = false,
                Message = ex.Message
            };
        }
    }
}
