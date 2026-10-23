package com.courier.dto;

import java.time.ZonedDateTime;

public class TrackingEventResponseDto {

    private String eventId;
    private String trackingNumber;
    private String location;
    private String status;
    private ZonedDateTime timestamp;
    private String remarks;

    public TrackingEventResponseDto() {
    }

    public TrackingEventResponseDto(String eventId, String location, String status, ZonedDateTime timestamp) {
        this.eventId = eventId;
        this.location = location;
        this.status = status;
        this.timestamp = timestamp;
    }

    public TrackingEventResponseDto(String eventId, String trackingNumber, String location, String status, ZonedDateTime timestamp, String remarks) {
        this.eventId = eventId;
        this.trackingNumber = trackingNumber;
        this.location = location;
        this.status = status;
        this.timestamp = timestamp;
        this.remarks = remarks;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
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

    public ZonedDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(ZonedDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
