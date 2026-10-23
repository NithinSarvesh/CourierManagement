package com.courier.model;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.time.Instant;
import java.util.Objects;

@Node("DeliveryAttempt")
public class DeliveryAttempt {

    @Id
    private String attemptId;
    private Integer attemptNumber;
    private String result; // SUCCESS, CUSTOMER_UNAVAILABLE, ADDRESS_NOT_FOUND, REJECTED, RESCHEDULED, FAILED
    private String remarks;
    private Instant timestamp;

    public DeliveryAttempt() {
    }

    public DeliveryAttempt(String attemptId, Integer attemptNumber, String result) {
        this.attemptId = attemptId;
        this.attemptNumber = attemptNumber;
        this.result = result;
        this.timestamp = Instant.now();
    }

    public DeliveryAttempt(String attemptId, Integer attemptNumber, String result, String remarks, Instant timestamp) {
        this.attemptId = attemptId;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DeliveryAttempt that = (DeliveryAttempt) o;
        return Objects.equals(attemptId, that.attemptId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(attemptId);
    }
}
