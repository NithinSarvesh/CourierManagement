package com.courier.repository;

import com.courier.model.TrackingEvent;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TrackingEventRepository extends Neo4jRepository<TrackingEvent, String>, TrackingEventRepositoryCustom {

    @Query("MATCH (p:Parcel {trackingNumber: $trackingNumber})-[:HAS_TRACKING_EVENT]->(te:TrackingEvent) " +
           "WHERE te.status = $status AND te.location = $location " +
           "RETURN count(te)")
    long countDuplicateEvents(@Param("trackingNumber") String trackingNumber,
                              @Param("status") String status,
                              @Param("location") String location);
}
