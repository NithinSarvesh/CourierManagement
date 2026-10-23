package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class PaymentRepositoryImpl implements PaymentRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public PaymentRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public Optional<Map<String, Object>> findPaymentDetailsById(String paymentId) {
        String cypher = "MATCH (p:Parcel)-[:HAS_PAYMENT]->(pay:Payment {paymentId: $paymentId}) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       pay.amount AS amount, pay.method AS method, pay.status AS status, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef";

        return neo4jClient.query(cypher)
                .bind(paymentId).to("paymentId")
                .fetch()
                .one();
    }

    @Override
    public Optional<Map<String, Object>> findPaymentByParcel(String trackingNumber) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_PAYMENT]->(pay:Payment) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       pay.amount AS amount, pay.method AS method, pay.status AS status, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef";

        return neo4jClient.query(cypher)
                .bind(trackingNumber).to("trackingNumber")
                .fetch()
                .one();
    }

    @Override
    public List<Map<String, Object>> findPaymentsByCustomer(String customerId) {
        String cypher = "MATCH (c:Customer {customerId: $customerId})-[:BOOKED]->(p:Parcel)-[:HAS_PAYMENT]->(pay:Payment) " +
                "RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       pay.amount AS amount, pay.method AS method, pay.status AS status, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef " +
                "ORDER BY pay.paymentId DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(customerId).to("customerId")
                .fetch()
                .all());
    }

    @Override
    public List<Map<String, Object>> findAllPaymentsPaged(String status, String method, long skip, int limit) {
        String cypher = "MATCH (p:Parcel)-[:HAS_PAYMENT]->(pay:Payment) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "WHERE ($status IS NULL OR pay.status = $status) " +
                "  AND ($method IS NULL OR pay.method = $method) " +
                "RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       pay.amount AS amount, pay.method AS method, pay.status AS status, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef " +
                "ORDER BY pay.paymentId DESC SKIP $skip LIMIT $limit";

        Map<String, Object> params = new HashMap<>();
        params.put("status", status);
        params.put("method", method);
        params.put("skip", skip);
        params.put("limit", limit);

        return new ArrayList<>(neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .all());
    }

    @Override
    public Map<String, Object> addPaymentToParcel(String trackingNumber,
                                                 String paymentId,
                                                 Double amount,
                                                 String method,
                                                 String status,
                                                 String paymentDate,
                                                 String transactionRef) {
        String cypher = "MATCH (p:Parcel {trackingNumber: $trackingNumber}) " +
                "CREATE (pay:Payment {paymentId: $paymentId, amount: $amount, method: $method, status: $status, paymentDate: datetime($paymentDate), transactionRef: $transactionRef}) " +
                "MERGE (p)-[:HAS_PAYMENT]->(pay) " +
                "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
                "RETURN pay.paymentId AS paymentId, p.trackingNumber AS trackingNumber, " +
                "       c.customerId AS customerId, c.name AS customerName, " +
                "       pay.amount AS amount, pay.method AS method, pay.status AS status, " +
                "       toString(pay.paymentDate) AS paymentDate, pay.transactionRef AS transactionRef";

        Map<String, Object> params = new HashMap<>();
        params.put("trackingNumber", trackingNumber);
        params.put("paymentId", paymentId);
        params.put("amount", amount);
        params.put("method", method);
        params.put("status", status);
        params.put("paymentDate", paymentDate);
        params.put("transactionRef", transactionRef);

        return neo4jClient.query(cypher)
                .bindAll(params)
                .fetch()
                .one()
                .orElse(Collections.emptyMap());
    }
}
