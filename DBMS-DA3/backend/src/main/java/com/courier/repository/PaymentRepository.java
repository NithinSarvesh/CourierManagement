package com.courier.repository;

import com.courier.model.Payment;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends Neo4jRepository<Payment, String>, PaymentRepositoryCustom {

    @Query("MATCH (p:Parcel)-[:HAS_PAYMENT]->(pay:Payment) " +
           "WHERE ($status IS NULL OR pay.status = $status) " +
           "  AND ($method IS NULL OR pay.method = $method) " +
           "RETURN count(pay)")
    long countPaymentsWithFilter(@Param("status") String status, @Param("method") String method);
}
