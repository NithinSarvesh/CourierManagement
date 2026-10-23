package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class VehicleRepositoryImpl implements VehicleRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public VehicleRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public Optional<VehicleDetailsProjection> findVehicleDetails(String vehicleId) {
        String cypher = "MATCH (v:Vehicle {vehicleId: $vehicleId}) " +
                "OPTIONAL MATCH (v)-[:ASSIGNED_TO]-(da:DeliveryAgent) " +
                "RETURN v.vehicleId AS vehicleId, v.type AS type, " +
                "       v.registration AS registration, v.capacityKg AS capacityKg, " +
                "       coalesce(v.status, CASE WHEN da IS NOT NULL THEN 'IN_USE' ELSE 'AVAILABLE' END) AS status, " +
                "       da.agentId AS assignedAgentId, " +
                "       da.name AS assignedAgentName";

        return neo4jClient.query(cypher)
                .bind(vehicleId).to("vehicleId")
                .fetchAs(VehicleDetailsProjection.class)
                .mappedBy((typeSystem, record) -> new VehicleDetailsProjection(
                        record.get("vehicleId").isNull() ? null : record.get("vehicleId").asString(),
                        record.get("type").isNull() ? null : record.get("type").asString(),
                        record.get("registration").isNull() ? null : record.get("registration").asString(),
                        record.get("capacityKg").isNull() ? null : record.get("capacityKg").asDouble(),
                        record.get("status").isNull() ? null : record.get("status").asString(),
                        record.get("assignedAgentId").isNull() ? null : record.get("assignedAgentId").asString(),
                        record.get("assignedAgentName").isNull() ? null : record.get("assignedAgentName").asString()
                ))
                .one();
    }

    @Override
    public List<VehicleDetailsProjection> findAllVehiclesWithAgent() {
        String cypher = "MATCH (v:Vehicle) " +
                "OPTIONAL MATCH (v)-[:ASSIGNED_TO]-(da:DeliveryAgent) " +
                "RETURN v.vehicleId AS vehicleId, v.type AS type, " +
                "       v.registration AS registration, v.capacityKg AS capacityKg, " +
                "       coalesce(v.status, CASE WHEN da IS NOT NULL THEN 'IN_USE' ELSE 'AVAILABLE' END) AS status, " +
                "       da.agentId AS assignedAgentId, " +
                "       da.name AS assignedAgentName ORDER BY v.vehicleId ASC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .fetchAs(VehicleDetailsProjection.class)
                .mappedBy((typeSystem, record) -> new VehicleDetailsProjection(
                        record.get("vehicleId").isNull() ? null : record.get("vehicleId").asString(),
                        record.get("type").isNull() ? null : record.get("type").asString(),
                        record.get("registration").isNull() ? null : record.get("registration").asString(),
                        record.get("capacityKg").isNull() ? null : record.get("capacityKg").asDouble(),
                        record.get("status").isNull() ? null : record.get("status").asString(),
                        record.get("assignedAgentId").isNull() ? null : record.get("assignedAgentId").asString(),
                        record.get("assignedAgentName").isNull() ? null : record.get("assignedAgentName").asString()
                ))
                .all());
    }
}
