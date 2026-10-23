package com.courier.dto;

import java.time.Instant;

public class DeliveryAttemptDto {

    private String attemptId;
    private String trackingNumber;
    private Integer attemptNumber;
    private String result;
    private String remarks;
    private Instant timestamp;

    public DeliveryAttemptDto() {
    }

    public DeliveryAttemptDto(String attemptId, String trackingNumber, Integer attemptNumber, String result, String remarks, Instant timestamp) {
        this.attemptId = attemptId;
        this.trackingNumber = trackingNumber;
        this.attemptNumber = attemptNumber;
        this.result = result;
        this.remarks = remarks;
        this.timestamp = timestamp;
    }

    public String getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(String attemptId) {
        this.attemptId = attemptId;
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

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
