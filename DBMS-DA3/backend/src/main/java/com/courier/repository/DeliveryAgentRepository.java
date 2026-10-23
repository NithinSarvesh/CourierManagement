package com.courier.repository;

import com.courier.model.DeliveryAgent;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryAgentRepository extends Neo4jRepository<DeliveryAgent, String>, DeliveryAgentRepositoryCustom {

    @Query("MATCH (da:DeliveryAgent {agentId: $agentId}) RETURN da")
    Optional<DeliveryAgent> findByAgentId(@Param("agentId") String agentId);

    @Query("MATCH (da:DeliveryAgent) RETURN da ORDER BY da.agentId ASC")
    List<DeliveryAgent> findAllAgents();

    @Query("MATCH (da:DeliveryAgent {status: 'AVAILABLE'}) RETURN da ORDER BY da.name ASC")
    List<DeliveryAgent> findAvailableAgents();

    @Query("MATCH (da:DeliveryAgent {agentId: $agentId}) SET da.status = $status RETURN da")
    DeliveryAgent updateAgentStatus(@Param("agentId") String agentId, @Param("status") String status);

    @Query("MATCH (da:DeliveryAgent {agentId: $agentId})-[:ASSIGNED_TO]->(p:Parcel) " +
           "WHERE p.status IN ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] " +
           "RETURN count(p)")
    long countActiveDeliveries(@Param("agentId") String agentId);

    @Query("MERGE (da:DeliveryAgent {agentId: $agentId}) " +
           "ON CREATE SET da.name = $name, da.phone = $phone, da.status = $status " +
           "ON MATCH SET da.name = $name, da.phone = $phone, da.status = $status " +
           "RETURN da")
    DeliveryAgent saveOrUpdateAgent(@Param("agentId") String agentId,
                                    @Param("name") String name,
                                    @Param("phone") String phone,
                                    @Param("status") String status);
}
