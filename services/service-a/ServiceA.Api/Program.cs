var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5301");
var app = builder.Build();

app.MapGet("/api/v1/service-a/health", () => Results.Ok(new { status = "ok", service = "service-a" }));
app.MapGet("/api/v1/service-a/products", () => Results.Ok(new[] {
    new { id = "1", name = "StockWise Producto A1" },
    new { id = "2", name = "StockWise Producto A2" }
}));

app.Run();
