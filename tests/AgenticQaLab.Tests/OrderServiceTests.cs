using Microsoft.VisualStudio.TestTools.UnitTesting;
using AgenticQaLab.Api.Models;
using AgenticQaLab.Api.Services;

namespace AgenticQaLab.Tests;

[TestClass]
public sealed class OrderServiceTests
{
    [TestMethod]
    public void Create_WithValidInput_CreatesOrderInCreatedStatus()
    {
        var service = new OrderService();

        var order = service.Create("Rivka", 125.50m);

        Assert.AreEqual("Rivka", order.CustomerName);
        Assert.AreEqual(125.50m, order.Amount);
        Assert.AreEqual(OrderStatus.Created, order.Status);
        Assert.AreNotEqual(Guid.Empty, order.Id);
    }

    [TestMethod]
    public void Create_WithBlankCustomerName_ThrowsArgumentException()
    {
        var service = new OrderService();

        Assert.ThrowsException<ArgumentException>(() => service.Create("  ", 20m));
    }

    [TestMethod]
    public void Create_WithCustomerNameOfExactly100Characters_CreatesOrder()
    {
        var service = new OrderService();
        var customerName = new string('a', 100);

        var order = service.Create(customerName, 20m);

        Assert.AreEqual(customerName, order.CustomerName);
    }

    [TestMethod]
    public void Create_WithCustomerNameLongerThan100Characters_ThrowsArgumentException()
    {
        var service = new OrderService();

        Assert.ThrowsException<ArgumentException>(() => service.Create(new string('a', 101), 20m));
    }

    [TestMethod]
    public void Create_WithPadded100CharacterCustomerName_TrimsBeforeValidatingAndCreatingOrder()
    {
        var service = new OrderService();
        var customerName = new string('a', 100);

        var order = service.Create($"  {customerName}  ", 20m);

        Assert.AreEqual(customerName, order.CustomerName);
    }

    [TestMethod]
    public void Create_WithNonPositiveAmount_ThrowsArgumentOutOfRangeException()
    {
        var service = new OrderService();

        Assert.ThrowsException<ArgumentOutOfRangeException>(() => service.Create("Rivka", 0m));
    }

    [TestMethod]
    public void Create_WithMaximumAmount_CreatesOrder()
    {
        var service = new OrderService();

        var order = service.Create("Rivka", 10000m);

        Assert.AreEqual(10000m, order.Amount);
    }

    [TestMethod]
    public void Create_WithAmountAboveMaximum_ThrowsArgumentOutOfRangeException()
    {
        var service = new OrderService();

        Assert.ThrowsException<ArgumentOutOfRangeException>(() => service.Create("Rivka", 10000.01m));
    }

    [TestMethod]
    public void Get_WithUnknownId_ReturnsNull()
    {
        var service = new OrderService();

        var result = service.Get(Guid.NewGuid());

        Assert.IsNull(result);
    }

    [TestMethod]
    public void UpdateStatus_CreatedToPaid_Succeeds()
    {
        var service = new OrderService();
        var order = service.Create("Rivka", 50m);

        var updated = service.UpdateStatus(order.Id, OrderStatus.Paid);

        Assert.IsNotNull(updated);
        Assert.AreEqual(OrderStatus.Paid, updated.Status);
    }

    [TestMethod]
    public void UpdateStatus_PaidToShipped_Succeeds()
    {
        var service = new OrderService();
        var order = service.Create("Rivka", 50m);
        service.UpdateStatus(order.Id, OrderStatus.Paid);

        var updated = service.UpdateStatus(order.Id, OrderStatus.Shipped);

        Assert.IsNotNull(updated);
        Assert.AreEqual(OrderStatus.Shipped, updated.Status);
    }

    [TestMethod]
    public void UpdateStatus_CreatedToShipped_ThrowsInvalidOperationException()
    {
        var service = new OrderService();
        var order = service.Create("Rivka", 50m);

        Assert.ThrowsException<InvalidOperationException>(
            () => service.UpdateStatus(order.Id, OrderStatus.Shipped));
    }

    [TestMethod]
    public void UpdateStatus_CreatedToCreated_ThrowsInvalidOperationException()
    {
        var service = new OrderService();
        var order = service.Create("Rivka", 50m);

        Assert.ThrowsException<InvalidOperationException>(
            () => service.UpdateStatus(order.Id, OrderStatus.Created));
    }

    [TestMethod]
    public void UpdateStatus_PaidToCreated_ThrowsInvalidOperationException()
    {
        var service = new OrderService();
        var order = service.Create("Rivka", 50m);
        service.UpdateStatus(order.Id, OrderStatus.Paid);

        Assert.ThrowsException<InvalidOperationException>(
            () => service.UpdateStatus(order.Id, OrderStatus.Created));
    }

    [TestMethod]
    public void UpdateStatus_PaidToPaid_ThrowsInvalidOperationException()
    {
        var service = new OrderService();
        var order = service.Create("Rivka", 50m);
        service.UpdateStatus(order.Id, OrderStatus.Paid);

        Assert.ThrowsException<InvalidOperationException>(
            () => service.UpdateStatus(order.Id, OrderStatus.Paid));
    }

    [TestMethod]
    public void UpdateStatus_ShippedToAnyStatus_ThrowsInvalidOperationException()
    {
        var service = new OrderService();
        var order = service.Create("Rivka", 50m);
        service.UpdateStatus(order.Id, OrderStatus.Paid);
        service.UpdateStatus(order.Id, OrderStatus.Shipped);

        Assert.ThrowsException<InvalidOperationException>(
            () => service.UpdateStatus(order.Id, OrderStatus.Paid));
    }

    [TestMethod]
    public void UpdateStatus_WithUnknownId_ReturnsNull()
    {
        var service = new OrderService();

        var result = service.UpdateStatus(Guid.NewGuid(), OrderStatus.Paid);

        Assert.IsNull(result);
    }
}
