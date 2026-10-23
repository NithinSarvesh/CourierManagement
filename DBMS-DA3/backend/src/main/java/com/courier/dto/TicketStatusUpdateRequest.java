package com.courier.dto;

import jakarta.validation.constraints.NotBlank;

public class TicketStatusUpdateRequest {

    @NotBlank(message = "Status is required (OPEN, IN_PROGRESS, RESOLVED, CLOSED)")
    private String status;

    private String priority;
    private String remarks;

    public TicketStatusUpdateRequest() {
    }

    public TicketStatusUpdateRequest(String status, String remarks) {
        this.status = status;
        this.remarks = remarks;
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
}
