package com.courier.model;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Objects;

@Node("TrackingEvent")
public class TrackingEvent {

    @Id
    private String eventId;
    private String location;
    private String status;
    private ZonedDateTime timestamp;
    private String remarks;

    public TrackingEvent() {
    }

    public TrackingEvent(String eventId, String location, String status, ZonedDateTime timestamp) {
        this.eventId = eventId;
        this.location = location;
        this.status = status;
        this.timestamp = timestamp;
    }

    public TrackingEvent(String eventId, String location, String status, ZonedDateTime timestamp, String remarks) {
        this.eventId = eventId;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TrackingEvent that = (TrackingEvent) o;
        return Objects.equals(eventId, that.eventId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId);
    }
}
