package com.courier.controller;

import com.courier.model.Order;
import com.courier.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable int id) {
        return orderRepository.getOrderById(id);
    }

    @PostMapping
    public String addOrder(@RequestBody Order order) {
        orderRepository.addOrder(order);
        return "Order added successfully";
    }

    @PutMapping("/{id}")
    public String updateOrder(@PathVariable int id, @RequestBody Order order) {
        orderRepository.updateOrder(id, order);
        return "Order updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteOrder(@PathVariable int id) {
        orderRepository.deleteOrder(id);
        return "Order deleted successfully";
    }
    @GetMapping("/search")
    public List<Order> searchOrders(@RequestParam String status) {
        return orderRepository.searchOrders(status);
    }

    @GetMapping("/customer/{customerId}")
public List<Order> getOrdersByCustomerId(@PathVariable int customerId) {
    return orderRepository.getOrdersByCustomerId(customerId);
}
}