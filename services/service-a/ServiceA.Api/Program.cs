var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/api/v1/service-a/health", () => Results.Ok(new { status = "ok", service = "service-a" }));
app.MapGet("/api/v1/service-a/products", () => Results.Ok(new[] {
    new { id = "1", name = "Producto A1" },
    new { id = "2", name = "Producto A2" }
}));

app.Run();
