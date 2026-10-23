package com.courier.repository;

import com.courier.model.DeliveryAttempt;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryAttemptRepository extends Neo4jRepository<DeliveryAttempt, String>, DeliveryAttemptRepositoryCustom {

    @Query("MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_DELIVERY_ATTEMPT]->(da:DeliveryAttempt) " +
           "RETURN count(da)")
    long countAttemptsByParcel(@Param("trackingNumber") String trackingNumber);
}
