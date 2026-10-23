package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class ParcelRepositoryImpl implements ParcelRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public ParcelRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public Optional<Map<String, Object>> findFullParcelDetails(String trackingNumber) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber}) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch) " +
                "OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch) " +
                "OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService) " +
                "OPTIONAL MATCH (da:DeliveryAgent)-[:ASSIGNED_TO]->(p) " +
                "OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment) " +
                "RETURN p.trackingNumber AS trackingNumber, " +
                "       p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress, " +
                "       COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels, " +
                "       ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity, " +
                "       db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity, " +
                "       cs.serviceId AS serviceId, cs.name AS serviceName, " +
                "       cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge, " +
                "       cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive, " +
                "       da.agentId AS agentId, da.name AS agentName, " +
                "       da.phone AS agentPhone, da.status AS agentStatus, " +
                "       pay.paymentId AS paymentId, pay.amount AS paymentAmount, " +
                "       pay.method AS paymentMethod, pay.status AS paymentStatus, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef";

        return neo4jClient.query(cypher)
                .bind(trackingNumber).to("trackingNumber")
                .fetch()
                .one();
    }

    @Override
    public List<Map<String, Object>> searchParcelsPaged(String status,
                                                        String customerId,
                                                        String branchId,
                                                        String trackingNumber,
                                                        long skip,
                                                        int limit) {
        String cypher = "MATCH (p:Parcel) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch) " +
                "OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch) " +
                "OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService) " +
                "OPTIONAL MATCH (da:DeliveryAgent)-[:ASSIGNED_TO]->(p) " +
                "OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment) " +
                "WHERE ($status IS NULL OR p.status = $status) " +
                "  AND ($customerId IS NULL OR c.customerId = $customerId) " +
                "  AND ($branchId IS NULL OR ob.branchId = $branchId OR db.branchId = $branchId) " +
                "  AND ($trackingNumber IS NULL OR p.trackingNumber CONTAINS $trackingNumber) " +
                "RETURN p.trackingNumber AS trackingNumber, " +
                "       p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress, " +
                "       COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels, " +
                "       ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity, " +
                "       db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity, " +
                "       cs.serviceId AS serviceId, cs.name AS serviceName, " +
                "       cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge, " +
                "       cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive, " +
                "       da.agentId AS agentId, da.name AS agentName, " +
                "       da.phone AS agentPhone, da.status AS agentStatus, " +
                "       pay.paymentId AS paymentId, pay.amount AS paymentAmount, " +
                "       pay.method AS paymentMethod, pay.status AS paymentStatus, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef " +
                "ORDER BY p.trackingNumber DESC SKIP $skip LIMIT $limit";

        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("customerId", customerId);
        params.put("branchId", branchId);
        params.put("trackingNumber", trackingNumber);
        params.put("skip", skip);
        params.put("limit", limit);

        return new ArrayList<>(neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findParcelsByCustomerId(String customerId) {
        String cypher = "MATCH (c:Customer {customerId: $customerId})-[:BOOKED]->(p:Parcel) " +
                "OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch) " +
                "OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch) " +
                "OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService) " +
                "OPTIONAL MATCH (da:DeliveryAgent)-[:ASSIGNED_TO]->(p) " +
                "OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment) " +
                "RETURN p.trackingNumber AS trackingNumber, " +
                "       p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress, " +
                "       COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels, " +
                "       ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity, " +
                "       db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity, " +
                "       cs.serviceId AS serviceId, cs.name AS serviceName, " +
                "       cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge, " +
                "       cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive, " +
                "       da.agentId AS agentId, da.name AS agentName, " +
                "       da.phone AS agentPhone, da.status AS agentStatus, " +
                "       pay.paymentId AS paymentId, pay.amount AS paymentAmount, " +
                "       pay.method AS paymentMethod, pay.status AS paymentStatus, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef " +
                "ORDER BY p.trackingNumber DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(customerId).to("customerId")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findParcelsByBranch(String branchId, String type) {
        String cypher = "MATCH (p:Parcel) " +
                "WHERE (($type = 'origin' OR $type = 'all') AND " +
                "EXISTS { MATCH (p)-[:ORIGINATED_AT]->(:Branch {branchId: $branchId}) }) " +
                "OR (($type = 'destination' OR $type = 'all') AND " +
                "EXISTS { MATCH (p)-[:DESTINED_FOR]->(:Branch {branchId: $branchId}) }) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch) " +
                "OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch) " +
                "OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService) " +
                "OPTIONAL MATCH (da:DeliveryAgent)-[:ASSIGNED_TO]->(p) " +
                "OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment) " +
                "RETURN p.trackingNumber AS trackingNumber, " +
                "       p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress, " +
                "       COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels, " +
                "       ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity, " +
                "       db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity, " +
                "       cs.serviceId AS serviceId, cs.name AS serviceName, " +
                "       cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge, " +
                "       cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive, " +
                "       da.agentId AS agentId, da.name AS agentName, " +
                "       da.phone AS agentPhone, da.status AS agentStatus, " +
                "       pay.paymentId AS paymentId, pay.amount AS paymentAmount, " +
                "       pay.method AS paymentMethod, pay.status AS paymentStatus, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef " +
                "ORDER BY p.trackingNumber DESC";

        Map<String, Object> params = new HashMap<>();
        params.put("branchId", branchId);
        params.put("type", type);

        return new ArrayList<>(neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findParcelsByAgentId(String agentId) {
        String cypher = "MATCH (da:DeliveryAgent {agentId: $agentId})-[:ASSIGNED_TO]->(p:Parcel) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch) " +
                "OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch) " +
                "OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService) " +
                "OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment) " +
                "RETURN p.trackingNumber AS trackingNumber, " +
                "       p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress, " +
                "       COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels, " +
                "       ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity, " +
                "       db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity, " +
                "       cs.serviceId AS serviceId, cs.name AS serviceName, " +
                "       cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge, " +
                "       cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive, " +
                "       da.agentId AS agentId, da.name AS agentName, " +
                "       da.phone AS agentPhone, da.status AS agentStatus, " +
                "       pay.paymentId AS paymentId, pay.amount AS paymentAmount, " +
                "       pay.method AS paymentMethod, pay.status AS paymentStatus, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef " +
                "ORDER BY p.trackingNumber DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(agentId).to("agentId")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> getServiceUsageStatistics() {
        String cypher = "MATCH (p:Parcel)-[:USES_SERVICE]->(cs:CourierService) " +
                "RETURN cs.name AS serviceName, count(p) AS usageCount " +
                "ORDER BY usageCount DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> getParcelStatusCounts() {
        String cypher = "MATCH (p:Parcel) " +
                "RETURN p.status AS status, count(p) AS count";

        return new ArrayList<>(neo4jClient.query(cypher)
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findRecentBookings(int limit) {
        String cypher = "MATCH (p:Parcel) " +
                "WITH p ORDER BY p.trackingNumber DESC LIMIT $limit " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch) " +
                "OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch) " +
                "OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService) " +
                "OPTIONAL MATCH (da:DeliveryAgent)-[:ASSIGNED_TO]->(p) " +
                "OPTIONAL MATCH (p)-[:HAS_PAYMENT]->(pay:Payment) " +
                "RETURN p.trackingNumber AS trackingNumber, " +
                "       p.weight AS weight, p.deliveryCharge AS deliveryCharge, p.status AS status, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       c.email AS customerEmail, c.phone AS customerPhone, c.address AS customerAddress, " +
                "       COUNT { (c)-[:BOOKED]->(:Parcel) } AS customerTotalParcels, " +
                "       ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity, " +
                "       db.branchId AS destBranchId, db.name AS destBranchName, db.city AS destCity, " +
                "       cs.serviceId AS serviceId, cs.name AS serviceName, " +
                "       cs.estimatedDays AS estimatedDays, cs.baseCharge AS baseCharge, " +
                "       cs.description AS serviceDescription, coalesce(cs.active, true) AS serviceActive, " +
                "       da.agentId AS agentId, da.name AS agentName, " +
                "       da.phone AS agentPhone, da.status AS agentStatus, " +
                "       pay.paymentId AS paymentId, pay.amount AS paymentAmount, " +
                "       pay.method AS paymentMethod, pay.status AS paymentStatus, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef " +
                "ORDER BY p.trackingNumber DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(limit).to("limit")
                .fetch()
                .all());
    }
}
