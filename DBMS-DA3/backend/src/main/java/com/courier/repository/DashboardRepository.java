package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class DashboardRepository {

    private final Neo4jClient neo4jClient;

    public DashboardRepository(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public long getTotalCustomers() {
        return neo4jClient.query("MATCH (c:Customer) RETURN count(c) AS total")
                .fetchAs(Long.class)
                .one()
                .orElse(0L);
    }

    public long getTotalParcels() {
        return neo4jClient.query("MATCH (p:Parcel) RETURN count(p) AS total")
                .fetchAs(Long.class)
                .one()
                .orElse(0L);
    }

    public Map<String, Long> getParcelsByStatus() {
        Map<String, Long> result = new LinkedHashMap<>();
        Collection<Map<String, Object>> rows = neo4jClient.query(
                "MATCH (p:Parcel) RETURN p.status AS status, count(p) AS count ORDER BY count DESC"
        ).fetch().all();

        for (Map<String, Object> row : rows) {
            String status = (String) row.get("status");
            Long count = ((Number) row.get("count")).longValue();
            if (status != null) {
                result.put(status, count);
            }
        }
        return result;
    }

    public Map<String, Long> getAgentWorkload() {
        Map<String, Long> result = new LinkedHashMap<>();
        Collection<Map<String, Object>> rows = neo4jClient.query(
                "MATCH (da:DeliveryAgent) " +
                "OPTIONAL MATCH (da)-[:ASSIGNED_TO]->(p:Parcel) " +
                "RETURN da.name AS agentName, count(p) AS count " +
                "ORDER BY count DESC"
        ).fetch().all();

        for (Map<String, Object> row : rows) {
            String agentName = (String) row.get("agentName");
            Long count = ((Number) row.get("count")).longValue();
            if (agentName != null) {
                result.put(agentName, count);
            }
        }
        return result;
    }

    public Map<String, Long> getDeliveryOutcomeCounts() {
        Map<String, Long> result = new LinkedHashMap<>();
        Collection<Map<String, Object>> rows = neo4jClient.query(
                "MATCH (da:DeliveryAttempt) RETURN da.result AS result, count(da) AS count"
        ).fetch().all();

        for (Map<String, Object> row : rows) {
            String outcome = (String) row.get("result");
            Long count = ((Number) row.get("count")).longValue();
            if (outcome != null) {
                result.put(outcome, count);
            }
        }
        return result;
    }

    public Map<String, Long> getServiceUsage() {
        Map<String, Long> result = new LinkedHashMap<>();
        Collection<Map<String, Object>> rows = neo4jClient.query(
                "MATCH (cs:CourierService) " +
                "OPTIONAL MATCH (p:Parcel)-[:USES_SERVICE]->(cs) " +
                "RETURN cs.name AS serviceName, count(p) AS count " +
                "ORDER BY count DESC"
        ).fetch().all();

        for (Map<String, Object> row : rows) {
            String serviceName = (String) row.get("serviceName");
            Long count = ((Number) row.get("count")).longValue();
            if (serviceName != null) {
                result.put(serviceName, count);
            }
        }
        return result;
    }

    public Map<String, Map<String, Long>> getBranchParcelCounts() {
        Map<String, Map<String, Long>> result = new LinkedHashMap<>();
        Collection<Map<String, Object>> rows = neo4jClient.query(
                "MATCH (b:Branch) " +
                "OPTIONAL MATCH (p1:Parcel)-[:ORIGINATED_AT]->(b) " +
                "OPTIONAL MATCH (p2:Parcel)-[:DESTINED_FOR]->(b) " +
                "RETURN b.branchId AS branchId, b.name AS branchName, " +
                "       count(DISTINCT p1) AS originating, count(DISTINCT p2) AS destined"
        ).fetch().all();

        for (Map<String, Object> row : rows) {
            String branchName = (String) row.get("branchName");
            if (branchName != null) {
                Map<String, Long> counts = new HashMap<>();
                counts.put("originating", ((Number) row.get("originating")).longValue());
                counts.put("destined", ((Number) row.get("destined")).longValue());
                result.put(branchName, counts);
            }
        }
        return result;
    }
    public Map<String, Object> getPaymentSummary() {
    return neo4jClient.query(
            "MATCH (pay:Payment) " +
            "RETURN " +
            "coalesce(sum(CASE WHEN pay.status = 'PAID' THEN pay.amount ELSE 0 END), 0) AS totalPaid, " +
            "coalesce(sum(CASE WHEN pay.status = 'PENDING' THEN pay.amount ELSE 0 END), 0) AS totalPending, " +
            "count(pay) AS totalCount, " +
            "sum(CASE WHEN pay.status = 'PAID' THEN 1 ELSE 0 END) AS paidCount, " +
            "sum(CASE WHEN pay.status = 'PENDING' THEN 1 ELSE 0 END) AS pendingCount, " +
            "sum(CASE WHEN pay.status = 'FAILED' THEN 1 ELSE 0 END) AS failedCount"
    ).fetch().one().orElse(new HashMap<>());
}
}
