namespace AgenticQaLab.Api.Models;

public sealed class Order
{
    public Guid Id { get; init; }
    public required string CustomerName { get; init; }
    public decimal Amount { get; init; }
    public OrderStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; init; }
}
