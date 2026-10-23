package com.courier.repository;

import com.courier.model.Parcel;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParcelRepository extends Neo4jRepository<Parcel, String>, ParcelRepositoryCustom {

    @Query("MATCH (p:Parcel {trackingNumber: $trackingNumber}) RETURN p")
    Optional<Parcel> findByTrackingNumber(@Param("trackingNumber") String trackingNumber);

    @Query("MATCH (c:Customer {customerId: $customerId}), " +
           "(ob:Branch {branchId: $originBranchId}), " +
           "(db:Branch {branchId: $destinationBranchId}), " +
           "(cs:CourierService {serviceId: $serviceId}) " +
           "CREATE (p:Parcel {trackingNumber: $trackingNumber, " +
           "weight: $weight, deliveryCharge: $deliveryCharge, status: $status}) " +
           "MERGE (c)-[:BOOKED]->(p) " +
           "MERGE (p)-[:ORIGINATED_AT]->(ob) " +
           "MERGE (p)-[:DESTINED_FOR]->(db) " +
           "MERGE (p)-[:USES_SERVICE]->(cs) " +
           "RETURN p")
    Parcel createParcelWithRelationships(
            @Param("trackingNumber") String trackingNumber,
            @Param("weight") Double weight,
            @Param("deliveryCharge") Double deliveryCharge,
            @Param("status") String status,
            @Param("customerId") String customerId,
            @Param("originBranchId") String originBranchId,
            @Param("destinationBranchId") String destinationBranchId,
            @Param("serviceId") String serviceId);

    @Query("MATCH (p:Parcel) " +
           "OPTIONAL MATCH (c:Customer)-[:BOOKED]->(p) " +
           "OPTIONAL MATCH (p)-[:ORIGINATED_AT]->(ob:Branch) " +
           "OPTIONAL MATCH (p)-[:DESTINED_FOR]->(db:Branch) " +
           "WHERE ($status IS NULL OR p.status = $status) " +
           "AND ($customerId IS NULL OR c.customerId = $customerId) " +
           "AND ($branchId IS NULL OR ob.branchId = $branchId OR db.branchId = $branchId) " +
           "AND ($trackingNumber IS NULL OR p.trackingNumber CONTAINS $trackingNumber) " +
           "RETURN count(DISTINCT p) AS total")
    long countParcelsWithFilter(
            @Param("status") String status,
            @Param("customerId") String customerId,
            @Param("branchId") String branchId,
            @Param("trackingNumber") String trackingNumber);

    @Query("MATCH (p:Parcel {trackingNumber: $trackingNumber}), " +
           "(da:DeliveryAgent {agentId: $agentId}) " +
           "OPTIONAL MATCH (:DeliveryAgent)-[oldRel:ASSIGNED_TO]->(p) " +
           "DELETE oldRel " +
           "MERGE (da)-[:ASSIGNED_TO]->(p) " +
           "SET da.status = 'ON_DELIVERY' " +
           "RETURN p")
    Parcel assignAgentToParcel(
            @Param("trackingNumber") String trackingNumber,
            @Param("agentId") String agentId);

    @Query("MATCH (:DeliveryAgent)-[r:ASSIGNED_TO]->(p:Parcel {trackingNumber: $trackingNumber}) " +
           "DELETE r " +
           "RETURN p")
    Parcel unassignAgent(
            @Param("trackingNumber") String trackingNumber);

    @Query("MATCH (p:Parcel {trackingNumber: $trackingNumber}) " +
           "SET p.status = $status " +
           "RETURN p")
    Parcel updateParcelStatus(
            @Param("trackingNumber") String trackingNumber,
            @Param("status") String status);

    @Query("MATCH (p:Parcel {trackingNumber: $trackingNumber}) " +
           "SET p.weight = CASE WHEN $weight IS NOT NULL THEN $weight ELSE p.weight END " +
           "SET p.deliveryCharge = CASE WHEN $deliveryCharge IS NOT NULL THEN $deliveryCharge ELSE p.deliveryCharge END " +
           "RETURN p")
    Parcel updateParcelWeightAndCharge(
            @Param("trackingNumber") String trackingNumber,
            @Param("weight") Double weight,
            @Param("deliveryCharge") Double deliveryCharge);
}
