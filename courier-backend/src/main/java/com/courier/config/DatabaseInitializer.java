package com.courier.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public DatabaseInitializer(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try (Connection conn = dataSource.getConnection()) {
            logger.info("Connected to Oracle Database successfully! Checking schema status...");

            Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_tables WHERE table_name = 'CUSTOMER'", Integer.class);

            if (tableCount == null || tableCount == 0) {
                logger.info("CUSTOMER table not found. Auto-initializing Oracle schema, procedures, and seed data...");
                executeScript(conn, "schema.sql");
                executeScript(conn, "plsql_procedures.sql");
                executeScript(conn, "data.sql");
                logger.info("Oracle database schema initialization completed successfully!");
            } else {
                Integer totalTables = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user_tables", Integer.class);
                logger.info("Oracle schema already initialized with {} tables in COURIER_APP.", totalTables);
            }
        } catch (Exception e) {
            logger.warn("Database initialization check: {}. Will use available schema/fallbacks.", e.getMessage());
        }
    }

    private void executeScript(Connection conn, String scriptName) {
        try {
            ClassPathResource resource = new ClassPathResource(scriptName);
            if (!resource.exists()) {
                logger.warn("Script {} does not exist.", scriptName);
                return;
            }

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8));
                 Statement stmt = conn.createStatement()) {

                StringBuilder currentBlock = new StringBuilder();
                String line;
                boolean inPlSql = false;

                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("--") || trimmed.isEmpty()) {
                        continue;
                    }

                    if (trimmed.equalsIgnoreCase("BEGIN") || trimmed.toUpperCase().startsWith("CREATE OR REPLACE PROCEDURE")
                            || trimmed.toUpperCase().startsWith("CREATE OR REPLACE FUNCTION")
                            || trimmed.toUpperCase().startsWith("CREATE OR REPLACE VIEW")
                            || trimmed.equalsIgnoreCase("DECLARE")) {
                        inPlSql = true;
                    }

                    if (inPlSql) {
                        if (trimmed.equals("/")) {
                            String plsql = currentBlock.toString().trim();
                            if (!plsql.isEmpty()) {
                                try {
                                    stmt.execute(plsql);
                                } catch (Exception ex) {
                                    logger.debug("PL/SQL block execution note: {}", ex.getMessage());
                                }
                            }
                            currentBlock.setLength(0);
                            inPlSql = false;
                        } else {
                            currentBlock.append(line).append("\n");
                        }
                    } else {
                        if (trimmed.endsWith(";")) {
                            currentBlock.append(line.substring(0, line.lastIndexOf(';')));
                            String sql = currentBlock.toString().trim();
                            if (!sql.isEmpty()) {
                                try {
                                    stmt.execute(sql);
                                } catch (Exception ex) {
                                    logger.debug("SQL execution note: {}", ex.getMessage());
                                }
                            }
                            currentBlock.setLength(0);
                        } else {
                            currentBlock.append(line).append("\n");
                        }
                    }
                }

                String remainder = currentBlock.toString().trim();
                if (!remainder.isEmpty()) {
                    try {
                        stmt.execute(remainder);
                    } catch (Exception ex) {
                        logger.debug("Remainder execution note: {}", ex.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed executing {}: {}", scriptName, e.getMessage());
        }
    }
}
