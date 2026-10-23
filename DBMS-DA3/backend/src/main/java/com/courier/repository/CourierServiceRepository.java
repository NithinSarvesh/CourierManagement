package com.courier.repository;

import com.courier.model.CourierService;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourierServiceRepository extends Neo4jRepository<CourierService, String> {

    @Query("MATCH (cs:CourierService {serviceId: $serviceId}) RETURN cs")
    Optional<CourierService> findByServiceId(@Param("serviceId") String serviceId);

    @Query("MATCH (cs:CourierService) RETURN cs ORDER BY cs.serviceId ASC")
    List<CourierService> findAllServices();

    @Query("MATCH (cs:CourierService)<-[:USES_SERVICE]-(p:Parcel) WHERE cs.serviceId = $serviceId RETURN count(p)")
    long countParcelsUsingService(@Param("serviceId") String serviceId);

    @Query("MERGE (cs:CourierService {serviceId: $serviceId}) " +
           "ON CREATE SET cs.name = $name, cs.estimatedDays = $estimatedDays, cs.baseCharge = $baseCharge, cs.description = $description, cs.active = coalesce($active, true) " +
           "ON MATCH SET cs.name = $name, cs.estimatedDays = $estimatedDays, cs.baseCharge = $baseCharge, cs.description = $description, cs.active = coalesce($active, cs.active, true) " +
           "RETURN cs")
    CourierService saveOrUpdateService(@Param("serviceId") String serviceId,
                                        @Param("name") String name,
                                        @Param("estimatedDays") Integer estimatedDays,
                                        @Param("baseCharge") Double baseCharge,
                                        @Param("description") String description,
                                        @Param("active") Boolean active);
}
