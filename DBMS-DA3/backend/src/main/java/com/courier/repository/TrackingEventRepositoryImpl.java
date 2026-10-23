package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class TrackingEventRepositoryImpl implements TrackingEventRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public TrackingEventRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public List<Map<String, Object>> findEventsByParcelOrdered(String trackingNumber) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_TRACKING_EVENT]->(te:TrackingEvent) " +
                "RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location, " +
                "       te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks " +
                "ORDER BY te.timestamp ASC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(trackingNumber).to("trackingNumber")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findEventsByParcelTrackingNumbers(Collection<String> trackingNumbers) {
        if (trackingNumbers == null || trackingNumbers.isEmpty()) {
            return Collections.emptyList();
        }
        String cypher = "MATCH (p:Parcel)-[:HAS_TRACKING_EVENT]->(te:TrackingEvent) " +
                "WHERE p.trackingNumber IN $trackingNumbers " +
                "RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location, " +
                "       te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks " +
                "ORDER BY te.timestamp ASC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(trackingNumbers).to("trackingNumbers")
                .fetch()
                .all());
    }

    @Override
    public Optional<Map<String, Object>> findLatestEventByParcel(String trackingNumber) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_TRACKING_EVENT]->(te:TrackingEvent) " +
                "RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location, " +
                "       te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks " +
                "ORDER BY te.timestamp DESC LIMIT 1";

        return neo4jClient.query(cypher)
                .bind(trackingNumber).to("trackingNumber")
                .fetch()
                .one();
    }

    @Override
    public Map<String, Object> addTrackingEventToParcel(String trackingNumber,
                                                       String eventId,
                                                       String location,
                                                       String status,
                                                       String timestamp,
                                                       String remarks) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber}) " +
                "CREATE (te:TrackingEvent {eventId: $eventId, location: $location, status: $status, timestamp: datetime($timestamp), remarks: $remarks}) " +
                "MERGE (p)-[:HAS_TRACKING_EVENT]->(te) " +
                "SET p.status = $status " +
                "RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location, " +
                "       te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks";

        Map<String, Object> params = new HashMap<>();
        params.put("trackingNumber", trackingNumber);
        params.put("eventId", eventId);
        params.put("location", location);
        params.put("status", status);
        params.put("timestamp", timestamp);
        params.put("remarks", remarks);

        return neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .one()
                .orElse(Collections.emptyMap());
    }

    @Override
    public List<Map<String, Object>> findRecentTrackingEvents(int limit) {
        String cypher = "MATCH (p:Parcel)-[:HAS_TRACKING_EVENT]->(te:TrackingEvent) " +
                "RETURN te.eventId AS eventId, p.trackingNumber AS trackingNumber, te.location AS location, " +
                "       te.status AS status, toString(te.timestamp) AS timestamp, te.remarks AS remarks " +
                "ORDER BY te.timestamp DESC LIMIT $limit";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(limit).to("limit")
                .fetch()
                .all());
    }
}
