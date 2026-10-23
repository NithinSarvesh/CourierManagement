package com.courier.dto;

import jakarta.validation.constraints.NotBlank;

public class SupportTicketRequest {

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    private String trackingNumber;

    @NotBlank(message = "Subject is required")
    private String subject;

    private String priority; // LOW, MEDIUM, HIGH, URGENT (default MEDIUM)
    private String remarks;

    public SupportTicketRequest() {
    }

    public SupportTicketRequest(String customerId, String trackingNumber, String subject, String priority, String remarks) {
        this.customerId = customerId;
        this.trackingNumber = trackingNumber;
        this.subject = subject;
        this.priority = priority;
        this.remarks = remarks;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
