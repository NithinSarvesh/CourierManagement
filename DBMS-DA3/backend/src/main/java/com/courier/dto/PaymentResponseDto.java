package com.courier.dto;

import java.time.ZonedDateTime;

public class PaymentResponseDto {

    private String paymentId;
    private String trackingNumber;
    private String customerId;
    private String customerName;
    private Double amount;
    private String method;
    private String status;
    private ZonedDateTime paymentDate;
    private String transactionRef;

    public PaymentResponseDto() {
    }

    public PaymentResponseDto(String paymentId, Double amount, String method, String status) {
        this.paymentId = paymentId;
        this.amount = amount;
        this.method = method;
        this.status = status;
    }

    public PaymentResponseDto(String paymentId, String trackingNumber, String customerId, String customerName,
                              Double amount, String method, String status, ZonedDateTime paymentDate, String transactionRef) {
        this.paymentId = paymentId;
        this.trackingNumber = trackingNumber;
        this.customerId = customerId;
        this.customerName = customerName;
        this.amount = amount;
        this.method = method;
        this.status = status;
        this.paymentDate = paymentDate;
        this.transactionRef = transactionRef;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public ZonedDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(ZonedDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }
}
