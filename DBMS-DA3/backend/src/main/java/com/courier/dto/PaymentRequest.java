package com.courier.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public class PaymentRequest {

    @NotBlank(message = "Tracking number is required")
    private String trackingNumber;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Payment amount must be greater than 0")
    private Double amount;

    @NotBlank(message = "Payment method is required")
    @Pattern(regexp = "^(CASH|CARD|UPI)$", message = "Payment method must be CASH, CARD, or UPI")
    private String method;

    private String status; // PENDING, PAID, FAILED (default PAID if not provided)
    private String transactionRef;

    public PaymentRequest() {
    }

    public PaymentRequest(String trackingNumber, Double amount, String method, String status) {
        this.trackingNumber = trackingNumber;
        this.amount = amount;
        this.method = method;
        this.status = status;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
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

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }
}
