package com.courier.repository;

import com.courier.model.Vehicle;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends Neo4jRepository<Vehicle, String>, VehicleRepositoryCustom {

    @Query("MATCH (v:Vehicle {vehicleId: $vehicleId}) RETURN v")
    Optional<Vehicle> findByVehicleId(@Param("vehicleId") String vehicleId);

    @Query("MATCH (v:Vehicle) RETURN v ORDER BY v.vehicleId ASC")
    List<Vehicle> findAllVehicles();

    @Query("MERGE (v:Vehicle {vehicleId: $vehicleId}) " +
           "ON CREATE SET v.type = $type, v.registration = $registration, v.capacityKg = $capacityKg, v.status = $status " +
           "ON MATCH SET v.type = $type, v.registration = $registration, v.capacityKg = $capacityKg, v.status = $status " +
           "RETURN v")
    Vehicle saveOrUpdateVehicle(@Param("vehicleId") String vehicleId,
                                @Param("type") String type,
                                @Param("registration") String registration,
                                @Param("capacityKg") Double capacityKg,
                                @Param("status") String status);

    @Query("MATCH (v:Vehicle {vehicleId: $vehicleId}), (da:DeliveryAgent {agentId: $agentId}) " +
           "OPTIONAL MATCH (v)-[oldRel1:ASSIGNED_TO]->(:DeliveryAgent) " +
           "DELETE oldRel1 " +
           "OPTIONAL MATCH (:Vehicle)-[oldRel2:ASSIGNED_TO]->(da) " +
           "DELETE oldRel2 " +
           "MERGE (v)-[:ASSIGNED_TO]->(da) " +
           "SET v.status = 'IN_USE' " +
           "RETURN v")
    Vehicle assignVehicleToAgent(@Param("vehicleId") String vehicleId, @Param("agentId") String agentId);

    @Query("MATCH (v:Vehicle {vehicleId: $vehicleId}) " +
           "OPTIONAL MATCH (v)-[r:ASSIGNED_TO]->(:DeliveryAgent) " +
           "DELETE r " +
           "SET v.status = 'AVAILABLE' " +
           "RETURN v")
    Vehicle unassignVehicle(@Param("vehicleId") String vehicleId);
}
