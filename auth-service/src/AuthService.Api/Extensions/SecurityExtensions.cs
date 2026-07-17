using Microsoft.AspNetCore.DataProtection;

namespace AuthService.Api.Extensions;

public static class SecurityExtensions
{
    private static readonly string[] DefaultAllowedOrigins = ["http://localhost:3000", "https://localhost:3001", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://localhost:3000", "https://localhost:3001", "https://localhost:5173", "https://localhost:5174", "https://localhost:5175"];
    private static readonly string[] DefaultAdminOrigins = ["https://admin.localhost"];
    private static readonly string[] AllowedHttpMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
    private static readonly string[] AdminHttpMethods = ["GET", "POST", "PUT", "DELETE"];
    private static readonly string[] AdminAllowedHeaders = ["Content-Type", "Authorization"];
    public static IServiceCollection AddSecurityPolicies(this IServiceCollection services, IConfiguration configuration)
    {
        // Configurar CORS
        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCorsPolicy", builder =>
            {
                var allowedOrigins = configuration.GetSection("Security:AllowedOrigins").Get<string[]>()
                    ?? DefaultAllowedOrigins;

                builder.WithOrigins(allowedOrigins)
                       .AllowAnyHeader()
                       .WithMethods(AllowedHttpMethods)
                       .AllowCredentials()
                       .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
            });

            // Política restrictiva para endpoints administrativos
            options.AddPolicy("AdminCorsPolicy", builder =>
            {
                var adminOrigins = configuration.GetSection("Security:AdminAllowedOrigins").Get<string[]>()
                    ?? DefaultAdminOrigins;

                builder.WithOrigins(adminOrigins)
                       .WithHeaders(AdminAllowedHeaders)
                       .WithMethods(AdminHttpMethods)
                       .AllowCredentials();
            });
        });

        // Configurar Data Protection
        var keysDirectory = new DirectoryInfo("./keys");
        if (!keysDirectory.Exists)
        {
            keysDirectory.Create();
        }

        var dataProtectionBuilder = services.AddDataProtection()
                .PersistKeysToFileSystem(keysDirectory)
                .SetApplicationName("AuthDotnetApi")
                .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

        var environment = services.BuildServiceProvider().GetRequiredService<IWebHostEnvironment>();

        if (!environment.IsProduction())
        {
            foreach (var file in keysDirectory.GetFiles("*.xml", SearchOption.TopDirectoryOnly))
            {
                try
                {
                    file.Delete();
                }
                catch
                {
                    // Ignorar errores menores al limpiar llaves obsoletas en desarrollo
                }
            }
        }
        else if (OperatingSystem.IsWindows())
        {
            dataProtectionBuilder.ProtectKeysWithDpapi();
        }

        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.SuppressXFrameOptionsHeader = false;
            options.Cookie.Name = "__RequestVerificationToken";
            options.Cookie.HttpOnly = true;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.Cookie.SameSite = SameSiteMode.Strict;
        });

        return services;
    }

    public static IServiceCollection AddSecurityOptions(this IServiceCollection services)
    {
        services.Configure<CookiePolicyOptions>(options =>
        {
            options.CheckConsentNeeded = context => true;
            options.MinimumSameSitePolicy = SameSiteMode.Strict;
            options.HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always;
            options.Secure = CookieSecurePolicy.SameAsRequest;
        });

        return services;
    }
}

