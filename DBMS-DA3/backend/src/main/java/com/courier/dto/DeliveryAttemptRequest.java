package com.courier.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class DeliveryAttemptRequest {

    @NotBlank(message = "Tracking number is required")
    private String trackingNumber;

    @NotNull(message = "Attempt number is required")
    @Min(value = 1, message = "Attempt number must be at least 1")
    private Integer attemptNumber;

    @NotBlank(message = "Result is required (e.g., SUCCESS, CUSTOMER_UNAVAILABLE, ADDRESS_NOT_FOUND, REJECTED, RESCHEDULED, FAILED)")
    private String result;

    private String remarks;

    public DeliveryAttemptRequest() {
    }

    public DeliveryAttemptRequest(String trackingNumber, Integer attemptNumber, String result, String remarks) {
        this.trackingNumber = trackingNumber;
        this.attemptNumber = attemptNumber;
        this.result = result;
        this.remarks = remarks;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
