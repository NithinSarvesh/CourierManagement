package com.courier.model;

import java.time.LocalDateTime;

public class DeliveryAttempt {

    private int branchId;
    private int courierId;
    private int attemptNo;
    private LocalDateTime attemptTime;
    private String status;

    public DeliveryAttempt() {}

    public DeliveryAttempt(int branchId, int courierId, int attemptNo, LocalDateTime attemptTime, String status) {
        this.branchId = branchId;
        this.courierId = courierId;
        this.attemptNo = attemptNo;
        this.attemptTime = attemptTime;
        this.status = status;
    }

    public int getBranchId() {
        return branchId;
    }

    public void setBranchId(int branchId) {
        this.branchId = branchId;
    }

    public int getCourierId() {
        return courierId;
    }

    public void setCourierId(int courierId) {
        this.courierId = courierId;
    }

    public int getAttemptNo() {
        return attemptNo;
    }

    public void setAttemptNo(int attemptNo) {
        this.attemptNo = attemptNo;
    }

    public LocalDateTime getAttemptTime() {
        return attemptTime;
    }

    public void setAttemptTime(LocalDateTime attemptTime) {
        this.attemptTime = attemptTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}