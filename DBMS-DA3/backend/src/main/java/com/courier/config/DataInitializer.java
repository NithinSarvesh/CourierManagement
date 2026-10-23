package com.courier.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.neo4j.core.Neo4jClient;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final Neo4jClient neo4jClient;

    @Value("${spring.neo4j.uri:bolt://localhost:7687}")
    private String neo4jUri;

    public DataInitializer(Neo4jClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    @Override
    public void run(String... args) {
        log.info("Verifying Neo4j connectivity to {}", maskUri(neo4jUri));
        boolean isAuraOrProduction = isProductionOrAura(neo4jUri);

        try {
            Integer ping = neo4jClient.query("RETURN 1 AS ping")
                    .fetchAs(Integer.class)
                    .one()
                    .orElse(0);
            log.info("Neo4j database connectivity verified successfully (ping={}).", ping);
        } catch (Exception e) {
            log.error("Failed to connect to Neo4j database at {}: {}", maskUri(neo4jUri), e.getMessage());
            if (isAuraOrProduction) {
                throw new IllegalStateException(
                        "CRITICAL: Failed to connect to Neo4j database at " + maskUri(neo4jUri) + ". " +
                        "Please verify your NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD environment variables. " +
                        "Root cause: " + e.getMessage(), e);
            } else {
                log.warn("Local Neo4j connection not available. Application starting in offline mode: {}", e.getMessage());
                return;
            }
        }

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
            log.warn("Database initialization/backfill encountered an issue: {}", e.getMessage());
        }
    }

    private boolean isProductionOrAura(String uri) {
        if (uri == null) return false;
        String lower = uri.toLowerCase();
        return lower.contains("databases.neo4j.io")
                || lower.startsWith("neo4j+s://")
                || lower.startsWith("bolt+s://")
                || System.getenv("RENDER") != null;
    }

    private String maskUri(String uri) {
        if (uri == null) return "null";
        return uri.replaceAll("://([^:@]+)(:[^@]+)?@", "://$1:***@");
    }
}
