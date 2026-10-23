package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class RouteRepository {

    private final Neo4jClient neo4jClient;

    public RouteRepository(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public List<Map<String, Object>> exploreRoutes(String fromBranchId, String toBranchId) {
        StringBuilder cypher = new StringBuilder(
                "MATCH (ob:Branch)<-[:ORIGINATED_AT]-(p:Parcel)-[:DESTINED_FOR]->(db:Branch) " +
                "OPTIONAL MATCH (p)-[:USES_SERVICE]->(cs:CourierService) " +
                "WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();
        if (fromBranchId != null && !fromBranchId.isBlank()) {
            cypher.append(" AND ob.branchId = $fromBranchId ");
            params.put("fromBranchId", fromBranchId);
        }
        if (toBranchId != null && !toBranchId.isBlank()) {
            cypher.append(" AND db.branchId = $toBranchId ");
            params.put("toBranchId", toBranchId);
        }

        cypher.append(
                "RETURN ob.branchId AS originBranchId, ob.name AS originBranchName, ob.city AS originCity, " +
                "       db.branchId AS destinationBranchId, db.name AS destinationBranchName, db.city AS destinationCity, " +
                "       count(p) AS parcelCount, " +
                "       collect(DISTINCT cs.name) AS servicesUsed, " +
                "       collect(DISTINCT p.trackingNumber) AS trackingNumbers " +
                "ORDER BY parcelCount DESC"
        );

        return new ArrayList<>(neo4jClient.query(cypher.toString())
                .bindAll(params)
                .fetch()
                .all());
    }
}
