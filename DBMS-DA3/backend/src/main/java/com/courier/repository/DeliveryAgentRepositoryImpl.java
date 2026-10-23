package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.Map;
import java.util.Optional;

@Repository
public class DeliveryAgentRepositoryImpl implements DeliveryAgentRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public DeliveryAgentRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public Optional<Map<String, Object>> findAssignedVehicle(String agentId) {
        String cypher = "MATCH (v:Vehicle)-[:ASSIGNED_TO]-(da:DeliveryAgent {agentId: $agentId}) " +
                "RETURN v.vehicleId AS vehicleId, v.registration AS registration, v.type AS type";

        return neo4jClient.query(cypher)
                .bind(agentId).to("agentId")
                .fetch()
                .one();
    }
}
