package com.courier.repository;

import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Repository
public class BranchRepositoryImpl implements BranchRepositoryCustom {

    private final Neo4jClient neo4jClient;

    public BranchRepositoryImpl(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public List<Map<String, Object>> findConnectedDestinations(String branchId) {
        String cypher = "MATCH (origin:Branch {branchId: $branchId})<-[:ORIGINATED_AT]-(p:Parcel)-[:DESTINED_FOR]->(dest:Branch) " +
                "RETURN dest.branchId AS branchId, dest.name AS name, dest.city AS city, count(p) AS parcelCount " +
                "ORDER BY parcelCount DESC";

        return new ArrayList<>(neo4jClient.query(cypher)
                .bind(branchId).to("branchId")
                .fetch()
                .all());
    }
}
