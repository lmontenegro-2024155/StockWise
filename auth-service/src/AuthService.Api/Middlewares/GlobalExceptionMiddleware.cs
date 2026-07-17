using System.Net;
using System.Text.Json;
using AuthService.Api.Models;
using AuthService.Application.Exceptions;

namespace AuthService.Api.Middlewares;

public class GlobalExceptionMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, 
                "Unhandled exception occurred. TraceId: {TraceId}", 
                context.TraceIdentifier);

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";

        var errorResponse = MapException(exception);

        // Asegurar traceId consistente
        errorResponse.TraceId ??= context.TraceIdentifier;

        context.Response.StatusCode = errorResponse.StatusCode;

        var unified = new
        {
            success = false,
            message = errorResponse.Detail,
            errorCode = errorResponse.ErrorCode,
            traceId = errorResponse.TraceId,
            timestamp = errorResponse.Timestamp
        };

        var jsonResponse = JsonSerializer.Serialize(unified, JsonOptions);
        await context.Response.WriteAsync(jsonResponse);
    }

    private static ErrorResponse MapException(Exception exception) =>
        exception switch
        {
            BusinessException businessEx => CreateError(
                HttpStatusCode.BadRequest,
                "Business Logic Error",
                businessEx.Message,
                businessEx.ErrorCode),

            UnauthorizedAccessException => CreateError(
                HttpStatusCode.Unauthorized,
                "Unauthorized",
                "Credenciales inválidas o permisos insuficientes"),

            ArgumentException argEx => CreateError(
                HttpStatusCode.BadRequest,
                "Invalid Arguments",
                argEx.Message),

            InvalidOperationException invOpEx => MapInvalidOperation(invOpEx),

            _ => CreateError(
                HttpStatusCode.InternalServerError,
                "Internal Server Error",
                "An unexpected error occurred")
        };

    private static ErrorResponse MapInvalidOperation(InvalidOperationException ex)
    {
        var message = ex.Message ?? string.Empty;

        if (message.Contains("not found", StringComparison.OrdinalIgnoreCase))
        {
            return CreateError(
                HttpStatusCode.NotFound,
                "Not Found",
                message);
        }

        if (message.Contains("last administrator", StringComparison.OrdinalIgnoreCase) ||
            message.Contains("conflict", StringComparison.OrdinalIgnoreCase))
        {
            return CreateError(
                HttpStatusCode.Conflict,
                "Conflict",
                message);
        }

        return CreateError(
            HttpStatusCode.BadRequest,
            "Invalid Operation",
            message);
    }

    private static ErrorResponse CreateError(
        HttpStatusCode statusCode,
        string title,
        string detail,
        string? errorCode = null)
    {
        return new ErrorResponse
        {
            StatusCode = (int)statusCode,
            Title = title,
            Detail = detail,
            ErrorCode = errorCode
        };
    }
}
