var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/api/v1/service-b/health", () => Results.Ok(new { status = "ok", service = "service-b" }));
app.MapGet("/api/v1/service-b/orders", () => Results.Ok(new[] {
    new { id = "1001", status = "pending" },
    new { id = "1002", status = "done" }
}));

app.Run();
