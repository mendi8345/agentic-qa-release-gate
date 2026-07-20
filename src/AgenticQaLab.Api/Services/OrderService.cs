using AgenticQaLab.Api.Models;

namespace AgenticQaLab.Api.Services;

public sealed class OrderService
{
    private static readonly Dictionary<OrderStatus, OrderStatus> AllowedTransitions = new()
    {
        [OrderStatus.Created] = OrderStatus.Paid,
        [OrderStatus.Paid] = OrderStatus.Shipped,
    };

    private readonly Dictionary<Guid, Order> _orders = new();

    public Order Create(string customerName, decimal amount)
    {
        var normalizedCustomerName = customerName.Trim();

        if (string.IsNullOrWhiteSpace(normalizedCustomerName))
        {
            throw new ArgumentException("Customer name is required.", nameof(customerName));
        }

        if (normalizedCustomerName.Length > 100)
        {
            throw new ArgumentException("Customer name must not exceed 100 characters.", nameof(customerName));
        }

        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be greater than zero.");
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerName = normalizedCustomerName,
            Amount = amount,
            Status = OrderStatus.Created,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _orders[order.Id] = order;
        return order;
    }

    public Order? Get(Guid id)
    {
        return _orders.GetValueOrDefault(id);
    }

    public Order? UpdateStatus(Guid id, OrderStatus newStatus)
    {
        if (!_orders.TryGetValue(id, out var order))
        {
            return null;
        }

        if (!AllowedTransitions.TryGetValue(order.Status, out var allowed) || allowed != newStatus)
        {
            throw new InvalidOperationException(
                $"Transition from '{order.Status}' to '{newStatus}' is not allowed.");
        }

        order.Status = newStatus;
        return order;
    }
}
