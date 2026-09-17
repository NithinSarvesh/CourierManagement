package com.courier.model;

import java.time.LocalDateTime;

public class TrackingEvent {

    private int eventId;
    private int parcelId;
    private String eventType;
    private LocalDateTime eventTime;

    public TrackingEvent() {}

    public TrackingEvent(int eventId, int parcelId, String eventType, LocalDateTime eventTime) {
        this.eventId = eventId;
        this.parcelId = parcelId;
        this.eventType = eventType;
        this.eventTime = eventTime;
    }

    public int getEventId() {
        return eventId;
    }

    public void setEventId(int eventId) {
        this.eventId = eventId;
    }

    public int getParcelId() {
        return parcelId;
    }

    public void setParcelId(int parcelId) {
        this.parcelId = parcelId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getEventTime() {
        return eventTime;
    }

    public void setEventTime(LocalDateTime eventTime) {
        this.eventTime = eventTime;
    }
}