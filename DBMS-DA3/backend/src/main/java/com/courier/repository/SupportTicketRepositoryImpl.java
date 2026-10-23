package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class SupportTicketRepositoryImpl implements SupportTicketRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public SupportTicketRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public Optional<Map<String, Object>> findTicketDetailsById(String ticketId) {
        String cypher = "MATCH (t:SupportTicket {ticketId: $ticketId}) " +
                "OPTIONAL MATCH (c:Customer)-[:RAISED]->(t) " +
                "OPTIONAL MATCH (t)-[:ABOUT_PARCEL]->(p:Parcel) " +
                "OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(s:Staff) " +
                "RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName, " +
                "       p.trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status, " +
                "       t.priority AS priority, " +
                "       t.remarks AS remarks, " +
                "       s.staffId AS assignedStaffId, s.name AS assignedStaffName, " +
                "       toString(t.createdAt) AS createdAt";

        return neo4jClient.query(cypher)
                .bind(ticketId).to("ticketId")
                .fetch()
                .one();
    }

    @Override
    public List<Map<String, Object>> findTicketsByCustomer(String customerId) {
        String cypher = "MATCH (c:Customer {customerId: $customerId})-[:RAISED]->(t:SupportTicket) " +
                "OPTIONAL MATCH (t)-[:ABOUT_PARCEL]->(p:Parcel) " +
                "OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(s:Staff) " +
                "RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName, " +
                "       p.trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status, " +
                "       t.priority AS priority, " +
                "       t.remarks AS remarks, " +
                "       s.staffId AS assignedStaffId, s.name AS assignedStaffName, " +
                "       toString(t.createdAt) AS createdAt " +
                "ORDER BY t.ticketId DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(customerId).to("customerId")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findTicketsByParcel(String trackingNumber) {
        String cypher = "MATCH (t:SupportTicket)-[:ABOUT_PARCEL]->(p:Parcel {trackingNumber: $trackingNumber}) " +
                "OPTIONAL MATCH (c:Customer)-[:RAISED]->(t) " +
                "OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(s:Staff) " +
                "RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName, " +
                "       p.trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status, " +
                "       t.priority AS priority, " +
                "       t.remarks AS remarks, " +
                "       s.staffId AS assignedStaffId, s.name AS assignedStaffName, " +
                "       toString(t.createdAt) AS createdAt " +
                "ORDER BY t.ticketId DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(trackingNumber).to("trackingNumber")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findAllTicketsPaged(String status, String customerId, long skip, int limit) {
        String cypher = "MATCH (t:SupportTicket) " +
                "OPTIONAL MATCH (c:Customer)-[:RAISED]->(t) " +
                "OPTIONAL MATCH (t)-[:ABOUT_PARCEL]->(p:Parcel) " +
                "OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(s:Staff) " +
                "WHERE ($status IS NULL OR t.status = $status) " +
                "  AND ($customerId IS NULL OR c.customerId = $customerId) " +
                "RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName, " +
                "       p.trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status, " +
                "       t.priority AS priority, " +
                "       t.remarks AS remarks, " +
                "       s.staffId AS assignedStaffId, s.name AS assignedStaffName, " +
                "       toString(t.createdAt) AS createdAt " +
                "ORDER BY t.ticketId DESC SKIP $skip LIMIT $limit";

        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("customerId", customerId);
        params.put("skip", skip);
        params.put("limit", limit);

        return new ArrayList<>(neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .all());
    }

    @Override
    public Map<String, Object> createTicketWithCustomerAndParcel(String ticketId,
                                                                String customerId,
                                                                String trackingNumber,
                                                                String subject,
                                                                String status,
                                                                String priority,
                                                                String remarks,
                                                                String createdAt) {
        String cypher = "MATCH (c:Customer {customerId: $customerId}) " +
                "CREATE (t:SupportTicket {ticketId: $ticketId, subject: $subject, status: $status, priority: $priority, remarks: $remarks, createdAt: datetime($createdAt)}) " +
                "MERGE (c)-[:RAISED]->(t) " +
                "WITH t, c " +
                "OPTIONAL MATCH (p:Parcel {trackingNumber: $trackingNumber}) " +
                "FOREACH (_ IN CASE WHEN p IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:ABOUT_PARCEL]->(p)) " +
                "RETURN t.ticketId AS ticketId, c.customerId AS customerId, c.name AS customerName, " +
                "       $trackingNumber AS trackingNumber, t.subject AS subject, t.status AS status, " +
                "       t.priority AS priority, t.remarks AS remarks, " +
                "       NULL AS assignedStaffId, NULL AS assignedStaffName, " +
                "       toString(t.createdAt) AS createdAt";

        Map<String, Object> params = new HashMap<>();
        params.put("ticketId", ticketId);
        params.put("customerId", customerId);
        params.put("trackingNumber", trackingNumber);
        params.put("subject", subject);
        params.put("status", status);
        params.put("priority", priority);
        params.put("remarks", remarks);
        params.put("createdAt", createdAt);

        return neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .one()
                .orElse(Collections.emptyMap());
    }
}
