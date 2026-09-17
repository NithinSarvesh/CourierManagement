package com.courier.repository;

import com.courier.model.TrackingEvent;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public class TrackingEventRepository {

    private final JdbcTemplate jdbcTemplate;

    public TrackingEventRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TrackingEvent> getAllTrackingEvents() {
        String sql = "SELECT * FROM TRACKING_EVENT ORDER BY event_id";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new TrackingEvent(
                rs.getInt("event_id"),
                rs.getInt("parcel_id"),
                rs.getString("event_type"),
                rs.getTimestamp("event_time").toLocalDateTime()
        ));
    }

    public TrackingEvent getTrackingEventById(int id) {
        String sql = "SELECT * FROM TRACKING_EVENT WHERE event_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new TrackingEvent(
                rs.getInt("event_id"),
                rs.getInt("parcel_id"),
                rs.getString("event_type"),
                rs.getTimestamp("event_time").toLocalDateTime()
        ), id);
    }

    public int addTrackingEvent(TrackingEvent event) {
        int id = event.getEventId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(event_id), 7000) + 1 FROM TRACKING_EVENT", Integer.class);
            id = (nextId != null) ? nextId : 7001;
            event.setEventId(id);
        }
        java.time.LocalDateTime et = event.getEventTime() != null ? event.getEventTime() : java.time.LocalDateTime.now();
        event.setEventTime(et);

        String sql = "INSERT INTO TRACKING_EVENT (event_id, parcel_id, event_type, event_time) VALUES (?, ?, ?, ?)";

        return jdbcTemplate.update(
                sql,
                id,
                event.getParcelId(),
                event.getEventType(),
                Timestamp.valueOf(et)
        );
    }

    public int updateTrackingEvent(int id, TrackingEvent event) {
        java.time.LocalDateTime et = event.getEventTime() != null ? event.getEventTime() : java.time.LocalDateTime.now();
        String sql = "UPDATE TRACKING_EVENT SET parcel_id = ?, event_type = ?, event_time = ? WHERE event_id = ?";

        return jdbcTemplate.update(
                sql,
                event.getParcelId(),
                event.getEventType(),
                Timestamp.valueOf(et),
                id
        );
    }

    public int deleteTrackingEvent(int id) {
        String sql = "DELETE FROM TRACKING_EVENT WHERE event_id = ?";

        return jdbcTemplate.update(sql, id);
    }

    public List<TrackingEvent> getEventsByParcelId(int parcelId) {
    String sql = "SELECT * FROM TRACKING_EVENT WHERE parcel_id = ? ORDER BY event_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new TrackingEvent(
            rs.getInt("event_id"),
            rs.getInt("parcel_id"),
            rs.getString("event_type"),
            rs.getTimestamp("event_time").toLocalDateTime()
    ), parcelId);
}

    public List<TrackingEvent> searchTrackingEvents(String eventType) {
    String sql = "SELECT * FROM TRACKING_EVENT WHERE LOWER(event_type) LIKE LOWER(?) ORDER BY event_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new TrackingEvent(
            rs.getInt("event_id"),
            rs.getInt("parcel_id"),
            rs.getString("event_type"),
            rs.getTimestamp("event_time").toLocalDateTime()
    ), "%" + eventType + "%");
}
}