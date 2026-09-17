package com.courier.model;

import java.time.LocalDateTime;

public class Order {

    private int orderId;
    private int customerId;
    private int serviceId;
    private LocalDateTime orderDate;
    private String status;
    private double amount;

    public Order() {
    }

    public Order(int orderId, int customerId, int serviceId, LocalDateTime orderDate, String status, double amount) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.serviceId = serviceId;
        this.orderDate = orderDate;
        this.status = status;
        this.amount = amount;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public int getServiceId() {
        return serviceId;
    }

    public void setServiceId(int serviceId) {
        this.serviceId = serviceId;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }
}