package com.courier.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.ZonedDateTime;

public class TrackingEventRequest {

    private String trackingNumber;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Status is required")
    private String status;

    private String remarks;
    private ZonedDateTime timestamp;

    public TrackingEventRequest() {
    }

    public TrackingEventRequest(String trackingNumber, String location, String status, String remarks) {
        this.trackingNumber = trackingNumber;
        this.location = location;
        this.status = status;
        this.remarks = remarks;
        this.timestamp = ZonedDateTime.now();
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public ZonedDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(ZonedDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
