using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace AgenticQaLab.Tests;

[TestClass]
public sealed class OrderStatusApiTests
{
    private static WebApplicationFactory<Program> _factory = null!;
    private static HttpClient _client = null!;

    [ClassInitialize]
    public static void ClassInitialize(TestContext _)
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
    }

    [ClassCleanup]
    public static void ClassCleanup()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    private async Task<Guid> CreateOrderAsync()
    {
        var response = await _client.PostAsJsonAsync("/orders",
            new { customerName = "TestCustomer", amount = 99.99m });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<OrderResponse>();
        return body!.Id;
    }

    [TestMethod]
    public async Task PatchStatus_InvalidTransition_Returns400()
    {
        var orderId = await CreateOrderAsync();

        // Created → Shipped is not allowed
        var response = await _client.PatchAsJsonAsync(
            $"/orders/{orderId}/status",
            new { status = "Shipped" });

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [TestMethod]
    public async Task PatchStatus_UnknownStatusString_Returns400()
    {
        var orderId = await CreateOrderAsync();

        var response = await _client.PatchAsJsonAsync(
            $"/orders/{orderId}/status",
            new { status = "Cancelled" });

        Assert.AreEqual(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [TestMethod]
    public async Task PatchStatus_MissingOrder_Returns404()
    {
        var response = await _client.PatchAsJsonAsync(
            $"/orders/{Guid.NewGuid()}/status",
            new { status = "Paid" });

        Assert.AreEqual(HttpStatusCode.NotFound, response.StatusCode);
    }

    [TestMethod]
    public async Task PatchStatus_ValidTransition_CreatedToPaid_Returns200()
    {
        var orderId = await CreateOrderAsync();

        var response = await _client.PatchAsJsonAsync(
            $"/orders/{orderId}/status",
            new { status = "Paid" });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [TestMethod]
    public async Task PatchStatus_ValidTransition_PaidToShipped_Returns200()
    {
        var orderId = await CreateOrderAsync();
        var paidResponse = await _client.PatchAsJsonAsync($"/orders/{orderId}/status", new { status = "Paid" });
        Assert.AreEqual(HttpStatusCode.OK, paidResponse.StatusCode);

        var response = await _client.PatchAsJsonAsync(
            $"/orders/{orderId}/status",
            new { status = "Shipped" });

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

    private sealed record OrderResponse(Guid Id);
}
