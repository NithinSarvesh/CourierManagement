package com.courier.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final Neo4jClient neo4jClient;

    public DataInitializer(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public void run(String... args) {
        try {
            log.info("Checking and backfilling missing database properties in Neo4j...");

            // 1. Backfill vehicle status: IN_USE if assigned to an agent, AVAILABLE otherwise
            String vehicleCypher = "MATCH (v:Vehicle) WHERE v.status IS NULL " +
                    "OPTIONAL MATCH (v)-[:ASSIGNED_TO]-(da:DeliveryAgent) " +
                    "SET v.status = CASE WHEN da IS NOT NULL THEN 'IN_USE' ELSE 'AVAILABLE' END";
            neo4jClient.query(vehicleCypher).run();

            // 2. Synchronize existing Staff and Branch relationships/properties if one exists
            String staffBranchSync1 = "MATCH (s:Staff)-[:WORKS_AT]->(b:Branch) WHERE s.branchId IS NULL SET s.branchId = b.branchId";
            neo4jClient.query(staffBranchSync1).run();

            String staffBranchSync2 = "MATCH (s:Staff), (b:Branch {branchId: s.branchId}) WHERE NOT (s)-[:WORKS_AT]->(b) MERGE (s)-[:WORKS_AT]->(b)";
            neo4jClient.query(staffBranchSync2).run();

            log.info("Neo4j database property backfill completed successfully.");
        } catch (Exception e) {
            log.warn("Database initialization/backfill skipped or encountered an issue: {}", e.getMessage());
        }
    }
}
