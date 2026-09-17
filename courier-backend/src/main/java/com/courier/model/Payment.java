package com.courier.model;

public class Payment {

    private int paymentId;
    private int customerId;
    private int orderId;
    private double amount;
    private String status;

    public Payment() {}

    public Payment(int paymentId, int customerId, int orderId, double amount, String status) {
        this.paymentId = paymentId;
        this.customerId = customerId;
        this.orderId = orderId;
        this.amount = amount;
        this.status = status;
    }

    public int getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(int paymentId) {
        this.paymentId = paymentId;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}