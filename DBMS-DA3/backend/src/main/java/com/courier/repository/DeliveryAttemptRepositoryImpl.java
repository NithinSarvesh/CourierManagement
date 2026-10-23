package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class DeliveryAttemptRepositoryImpl implements DeliveryAttemptRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public DeliveryAttemptRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public List<Map<String, Object>> findAttemptsByParcel(String trackingNumber) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt) " +
                "RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber, da.attemptNumber AS attemptNumber, " +
                "       da.result AS result, da.remarks AS remarks, toString(da.timestamp) AS timestamp " +
                "ORDER BY da.attemptNumber ASC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(trackingNumber).to("trackingNumber")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findAttemptsByParcelTrackingNumbers(Collection<String> trackingNumbers) {
        if (trackingNumbers == null || trackingNumbers.isEmpty()) {
            return Collections.emptyList();
        }
        String cypher = "MATCH (p:Parcel)-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt) " +
                "WHERE p.trackingNumber IN $trackingNumbers " +
                "RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber, da.attemptNumber AS attemptNumber, " +
                "       da.result AS result, da.remarks AS remarks, toString(da.timestamp) AS timestamp " +
                "ORDER BY da.attemptNumber ASC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(trackingNumbers).to("trackingNumbers")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findAllAttempts() {
        String cypher = "MATCH (p:Parcel)-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt) " +
                "RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber, da.attemptNumber AS attemptNumber, " +
                "       da.result AS result, da.remarks AS remarks, toString(da.timestamp) AS timestamp " +
                "ORDER BY da.timestamp DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .fetch()
                .all());
    }

    @Override
    public Map<String, Object> addAttemptToParcel(String trackingNumber,
                                                 String attemptId,
                                                 Integer attemptNumber,
                                                 String result,
                                                 String remarks,
                                                 String timestamp) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber}) " +
                "CREATE (da:DeliveryAttempt {attemptId: $attemptId, attemptNumber: $attemptNumber, result: $result, remarks: $remarks, timestamp: datetime($timestamp)}) " +
                "MERGE (p)-[:HAS_DELIVERY_ATTEMPT]->(da) " +
                "RETURN da.attemptId AS attemptId, p.trackingNumber AS trackingNumber, da.attemptNumber AS attemptNumber, " +
                "       da.result AS result, da.remarks AS remarks, toString(da.timestamp) AS timestamp";

        Map<String, Object> params = new HashMap<>();
        params.put("trackingNumber", trackingNumber);
        params.put("attemptId", attemptId);
        params.put("attemptNumber", attemptNumber);
        params.put("result", result);
        params.put("remarks", remarks);
        params.put("timestamp", timestamp);

        return neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .one()
                .orElse(Collections.emptyMap());
    }
}
