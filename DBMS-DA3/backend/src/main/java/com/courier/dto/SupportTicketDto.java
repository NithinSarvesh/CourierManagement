package com.courier.dto;

import java.time.ZonedDateTime;

public class SupportTicketDto {

    private String ticketId;
    private String customerId;
    private String customerName;
    private String trackingNumber;
    private String subject;
    private String status;
    private String priority;
    private String remarks;
    private String assignedStaffId;
    private String assignedStaffName;
    private ZonedDateTime createdAt;

    public SupportTicketDto() {
    }

    public SupportTicketDto(String ticketId, String subject, String status) {
        this.ticketId = ticketId;
        this.subject = subject;
        this.status = status;
    }

    public SupportTicketDto(String ticketId, String customerId, String customerName, String trackingNumber,
                            String subject, String status, String priority, String remarks,
                            String assignedStaffId, String assignedStaffName, ZonedDateTime createdAt) {
        this.ticketId = ticketId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.trackingNumber = trackingNumber;
        this.subject = subject;
        this.status = status;
        this.priority = priority;
        this.remarks = remarks;
        this.assignedStaffId = assignedStaffId;
        this.assignedStaffName = assignedStaffName;
        this.createdAt = createdAt;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(String assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public String getAssignedStaffName() {
        return assignedStaffName;
    }

    public void setAssignedStaffName(String assignedStaffName) {
        this.assignedStaffName = assignedStaffName;
    }

    public ZonedDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
