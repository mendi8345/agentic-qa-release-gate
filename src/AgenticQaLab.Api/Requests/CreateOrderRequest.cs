namespace AgenticQaLab.Api.Requests;

public sealed record CreateOrderRequest(string CustomerName, decimal Amount);
