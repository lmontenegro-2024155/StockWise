using System;
using AuthService.Application.Interfaces;
using AuthService.Application.Services;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using AuthService.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;

namespace AuthService.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        var mongoConnectionString = configuration["MongoSettings:ConnectionString"]
            ?? "mongodb://admin:admin123@localhost:27017";
        var mongoDatabaseName = configuration["MongoSettings:DatabaseName"]
            ?? "stockwise";

        services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoConnectionString));
        services.AddSingleton(sp =>
        {
            var client = sp.GetRequiredService<IMongoClient>();
            return client.GetDatabase(mongoDatabaseName);
        });

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();
        services.AddScoped<IProductRepository, MongoProductRepository>();
        services.AddScoped<IInventoryMovementRepository, MongoInventoryMovementRepository>();
        services.AddScoped<IAuthService, Application.Services.AuthService>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IReportsService, ReportsService>();
        services.AddHttpClient<IServiceStatusClient, ServiceStatusClient>();
        services.AddScoped<IPasswordHashService, PasswordHashService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<ICloudinaryService, CloudinaryService>();

        services.AddHealthChecks();
        
        return services;
    }

    public static IServiceCollection AddApiDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}
