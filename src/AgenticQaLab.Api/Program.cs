using AgenticQaLab.Api.Models;
using AgenticQaLab.Api.Requests;
using AgenticQaLab.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<OrderService>();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/orders", (CreateOrderRequest request, OrderService service) =>
{
    try
    {
        var order = service.Create(request.CustomerName, request.Amount);
        return Results.Created($"/orders/{order.Id}", order);
    }
    catch (ArgumentException exception)
    {
        return Results.BadRequest(new { error = exception.Message });
    }
});

app.MapGet("/orders/{id:guid}", (Guid id, OrderService service) =>
{
    var order = service.Get(id);
    if (order is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(order);
});

app.MapPatch("/orders/{id:guid}/status", (
    Guid id,
    UpdateOrderStatusRequest request,
    OrderService service) =>
{
    if (!Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var newStatus))
    {
        return Results.BadRequest(new { error = "Unknown order status." });
    }

    var order = service.UpdateStatus(id, newStatus);
    if (order is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(order);
});

app.Run();

public partial class Program { }
