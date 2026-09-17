package com.courier.service;

import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Types;
import java.util.*;

@Service
public class DatabaseDemoService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseDemoService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public static class QueryMetadata {
        private String key;
        private String title;
        private String category;
        private String description;
        private String sql;

        public QueryMetadata(String key, String title, String category, String description, String sql) {
            this.key = key;
            this.title = title;
            this.category = category;
            this.description = description;
            this.sql = sql;
        }

        public String getKey() { return key; }
        public String getTitle() { return title; }
        public String getCategory() { return category; }
        public String getDescription() { return description; }
        public String getSql() { return sql; }
    }

    private static final Map<String, QueryMetadata> QUERY_REGISTRY = new LinkedHashMap<>();

    static {
        QUERY_REGISTRY.put("customer-orders", new QueryMetadata(
                "customer-orders",
                "Customer + Orders (2-Table Relational JOIN)",
                "JOIN Operations",
                "Demonstrates 1-to-Many relational join between Customer and Orders tables on customer_id.",
                "SELECT c.customer_id, c.name AS customer_name, c.email, c.city, o.order_id, TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') AS order_date, o.status, o.amount FROM CUSTOMER c JOIN ORDERS o ON c.customer_id = o.customer_id ORDER BY o.order_id DESC"
        ));

        QUERY_REGISTRY.put("customer-order-parcel", new QueryMetadata(
                "customer-order-parcel",
                "Customer + Order + Parcel + Courier (4-Table Multi-Join)",
                "JOIN Operations",
                "Performs a 4-table join connecting Customers, Orders, Parcels, and Courier partners for tracking shipment ownership.",
                "SELECT c.name AS customer_name, o.order_id, o.status AS order_status, p.parcel_id, p.price, NVL(cr.name, 'Unassigned') AS courier_partner FROM CUSTOMER c JOIN ORDERS o ON c.customer_id = o.customer_id JOIN PARCEL p ON o.order_id = p.order_id LEFT JOIN COURIER cr ON p.courier_id = cr.courier_id ORDER BY o.order_id DESC"
        ));

        QUERY_REGISTRY.put("pending-orders", new QueryMetadata(
                "pending-orders",
                "Pending & Active Orders (Filtering & Ordering)",
                "Selection & Filtering",
                "Filters orders requiring delivery action (status in 'Pending', 'In Transit', 'Processing').",
                "SELECT order_id, customer_id, TO_CHAR(order_date, 'YYYY-MM-DD HH24:MI') AS order_date, status, amount FROM ORDERS WHERE status IN ('Pending', 'In Transit', 'Processing') ORDER BY order_id ASC"
        ));

        QUERY_REGISTRY.put("customer-spending", new QueryMetadata(
                "customer-spending",
                "Customer Spending & Frequency (GROUP BY & Aggregates)",
                "Aggregation & GROUP BY",
                "Calculates COUNT, SUM, and AVG metrics grouped by customer record.",
                "SELECT c.customer_id, c.name, COUNT(o.order_id) AS total_orders, NVL(SUM(o.amount), 0) AS total_spent, NVL(ROUND(AVG(o.amount), 2), 0) AS avg_order_val FROM CUSTOMER c LEFT JOIN ORDERS o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name ORDER BY total_spent DESC"
        ));

        QUERY_REGISTRY.put("high-value-customers", new QueryMetadata(
                "high-value-customers",
                "High-Value Customer Filter (HAVING Clause)",
                "HAVING Filter",
                "Filters grouped results using the HAVING clause for customers who have spent more than ₹1,000.",
                "SELECT c.customer_id, c.name, COUNT(o.order_id) AS orders_placed, SUM(o.amount) AS total_spent FROM CUSTOMER c JOIN ORDERS o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.name HAVING SUM(o.amount) > 1000 ORDER BY total_spent DESC"
        ));

        QUERY_REGISTRY.put("above-avg-orders", new QueryMetadata(
                "above-avg-orders",
                "Orders Exceeding Average Amount (Nested Subquery)",
                "Subqueries",
                "Demonstrates an uncorrelated subquery in the WHERE clause computing the overall average order value.",
                "SELECT order_id, customer_id, status, amount, (SELECT ROUND(AVG(amount), 2) FROM ORDERS) AS overall_avg FROM ORDERS WHERE amount > (SELECT AVG(amount) FROM ORDERS) ORDER BY amount DESC"
        ));

        QUERY_REGISTRY.put("active-customers-exist", new QueryMetadata(
                "active-customers-exist",
                "Customers with Bookings (Correlated Subquery / EXISTS)",
                "Subqueries",
                "Uses the correlated EXISTS operator to identify customers who have placed at least one non-cancelled order.",
                "SELECT c.customer_id, c.name, c.email, c.city FROM CUSTOMER c WHERE EXISTS (SELECT 1 FROM ORDERS o WHERE o.customer_id = c.customer_id AND o.status <> 'Cancelled') ORDER BY c.customer_id"
        ));

        QUERY_REGISTRY.put("branch-statistics", new QueryMetadata(
                "branch-statistics",
                "Branch Resource Allocation (Multi-Join Aggregation)",
                "Aggregation & GROUP BY",
                "Aggregates total staff and services assigned per operational branch.",
                "SELECT b.branch_id, b.branch_name, b.city, COUNT(DISTINCT s.staff_id) AS staff_count, COUNT(DISTINCT cs.service_id) AS services_count FROM BRANCH b LEFT JOIN STAFF s ON b.branch_id = s.branch_id LEFT JOIN COURIER_SERVICE cs ON b.branch_id = cs.branch_id GROUP BY b.branch_id, b.branch_name, b.city ORDER BY b.branch_id"
        ));

        QUERY_REGISTRY.put("tracking-history", new QueryMetadata(
                "tracking-history",
                "Audit Trail & Tracking Events (Chronological Join)",
                "JOIN Operations",
                "Fetches timeline of parcel tracking events joined with parcel pricing and order details.",
                "SELECT te.event_id, te.parcel_id, te.event_type, TO_CHAR(te.event_time, 'YYYY-MM-DD HH24:MI') AS event_timestamp, p.order_id, p.price FROM TRACKING_EVENT te JOIN PARCEL p ON te.parcel_id = p.parcel_id ORDER BY te.event_time DESC"
        ));

        QUERY_REGISTRY.put("payment-breakdown", new QueryMetadata(
                "payment-breakdown",
                "Payment Mode Specialization (CASE & Subtype Joins)",
                "Advanced Relational Queries",
                "Demonstrates subtype mapping across PAYMENT, CASH_MODE, CARD_MODE, and ONLINE_MODE tables.",
                "SELECT p.payment_id, p.customer_id, p.order_id, p.amount, p.status, CASE WHEN cm.payment_id IS NOT NULL THEN 'Cash Mode' WHEN crd.payment_id IS NOT NULL THEN 'Card Mode' WHEN onl.payment_id IS NOT NULL THEN 'Online Mode' ELSE 'Unspecified' END AS payment_channel FROM PAYMENT p LEFT JOIN CASH_MODE cm ON p.payment_id = cm.payment_id LEFT JOIN CARD_MODE crd ON p.payment_id = crd.payment_id LEFT JOIN ONLINE_MODE onl ON p.payment_id = onl.payment_id ORDER BY p.payment_id DESC"
        ));

        QUERY_REGISTRY.put("view-customer-summary", new QueryMetadata(
                "view-customer-summary",
                "Querying Oracle View: VW_CUSTOMER_ORDER_SUMMARY",
                "Database Views",
                "Demonstrates database view encapsulation by selecting pre-compiled aggregates from VW_CUSTOMER_ORDER_SUMMARY.",
                "SELECT * FROM VW_CUSTOMER_ORDER_SUMMARY ORDER BY total_amount_spent DESC"
        ));

        QUERY_REGISTRY.put("view-active-tracking", new QueryMetadata(
                "view-active-tracking",
                "Querying Oracle View: VW_ACTIVE_PARCEL_TRACKING",
                "Database Views",
                "Executes against the compiled Oracle View that joins parcel details with latest tracking event.",
                "SELECT * FROM VW_ACTIVE_PARCEL_TRACKING ORDER BY parcel_id ASC"
        ));
    }

    public List<QueryMetadata> getAvailableQueries() {
        return new ArrayList<>(QUERY_REGISTRY.values());
    }

    public Map<String, Object> executeNamedQuery(String queryKey) {
        QueryMetadata meta = QUERY_REGISTRY.get(queryKey);
        if (meta == null) {
            throw new IllegalArgumentException("Unknown query key: " + queryKey);
        }

        long start = System.currentTimeMillis();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(meta.getSql());
        long duration = System.currentTimeMillis() - start;

        List<String> columns = new ArrayList<>();
        if (!rows.isEmpty()) {
            columns.addAll(rows.get(0).keySet());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("queryKey", meta.getKey());
        response.put("title", meta.getTitle());
        response.put("category", meta.getCategory());
        response.put("description", meta.getDescription());
        response.put("sqlStatement", meta.getSql());
        response.put("columns", columns);
        response.put("rows", rows);
        response.put("rowCount", rows.size());
        response.put("executionTimeMs", duration);

        return response;
    }

    public Map<String, Object> executeCustomSql(String rawSql) {
        Map<String, Object> response = new LinkedHashMap<>();
        if (rawSql == null || rawSql.trim().isEmpty()) {
            response.put("status", "ERROR");
            response.put("message", "SQL query cannot be empty.");
            return response;
        }

        String sql = rawSql.trim();
        if (sql.endsWith(";")) {
            sql = sql.substring(0, sql.length() - 1).trim();
        }

        // Security check: Disallow destructive server-level administration commands
        String upper = sql.toUpperCase();
        String[] forbidden = {
            "ALTER SYSTEM", "SHUTDOWN", "STARTUP", "DROP USER", "CREATE USER",
            "GRANT DBA", "DROP TABLESPACE", "ALTER DATABASE", "DISCONNECT", "PURGE RECYCLEBIN"
        };
        for (String f : forbidden) {
            if (upper.contains(f)) {
                response.put("status", "ERROR");
                response.put("sql", sql);
                response.put("message", "Command '" + f + "' is restricted for security during DBMS demonstrations.");
                return response;
            }
        }

        long start = System.currentTimeMillis();
        try {
            boolean isSelect = upper.startsWith("SELECT") || upper.startsWith("WITH");

            if (isSelect) {
                List<String> columns = new ArrayList<>();
                List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    if (columns.isEmpty()) {
                        try {
                            java.sql.ResultSetMetaData md = rs.getMetaData();
                            int colCount = md.getColumnCount();
                            for (int i = 1; i <= colCount; i++) {
                                columns.add(md.getColumnLabel(i));
                            }
                        } catch (Exception ignored) {}
                    }
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (String col : columns) {
                        try {
                            row.put(col, rs.getObject(col));
                        } catch (Exception ignored) {}
                    }
                    return row;
                });

                long duration = System.currentTimeMillis() - start;
                response.put("status", "SUCCESS");
                response.put("sql", sql);
                response.put("queryType", "SELECT");
                response.put("columns", columns);
                response.put("rows", rows);
                response.put("rowCount", rows.size());
                response.put("executionTimeMs", duration);
                response.put("message", "Query executed successfully (" + rows.size() + " row(s) returned in " + duration + " ms).");
            } else {
                int affected = jdbcTemplate.update(sql);
                long duration = System.currentTimeMillis() - start;
                response.put("status", "SUCCESS");
                response.put("sql", sql);
                response.put("queryType", "DML/DDL");
                response.put("columns", List.of("AFFECTED_ROWS"));
                response.put("rows", List.of(Map.of("AFFECTED_ROWS", affected)));
                response.put("rowCount", affected);
                response.put("executionTimeMs", duration);
                response.put("message", "Statement executed successfully. " + affected + " row(s) affected in " + duration + " ms.");
            }
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            response.put("status", "ERROR");
            response.put("sql", sql);
            response.put("executionTimeMs", duration);
            String errMsg = e.getMessage() != null ? e.getMessage() : "Error executing SQL statement";
            // Clean up message if Spring wrapped SQLException
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errMsg = e.getCause().getMessage();
            }
            response.put("message", errMsg);
        }

        return response;
    }

    // ==========================================================
    // PL/SQL PROCEDURE & FUNCTION RUNNERS
    // ==========================================================

    public Map<String, Object> runGetCustomerOrderCount(int customerId) {
        long start = System.currentTimeMillis();
        Integer count = jdbcTemplate.execute(
                "{call GET_CUSTOMER_ORDER_COUNT(?, ?)}",
                (CallableStatementCallback<Integer>) cs -> {
                    cs.setInt(1, customerId);
                    cs.registerOutParameter(2, Types.INTEGER);
                    cs.execute();
                    return cs.getInt(2);
                }
        );
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "GET_CUSTOMER_ORDER_COUNT");
        res.put("type", "Stored Procedure (IN / OUT)");
        res.put("input", Map.of("customerId", customerId));
        res.put("result", Map.of("totalOrders", count != null ? count : 0));
        res.put("message", "Customer " + customerId + " has placed " + (count != null ? count : 0) + " order(s).");
        res.put("executionTimeMs", duration);
        res.put("status", "SUCCESS");
        return res;
    }

    public Map<String, Object> runUpdateParcelStatus(int parcelId, String newStatus) {
        long start = System.currentTimeMillis();
        String message = jdbcTemplate.execute(
                "{call UPDATE_PARCEL_STATUS(?, ?, ?)}",
                (CallableStatementCallback<String>) cs -> {
                    cs.setInt(1, parcelId);
                    cs.setString(2, newStatus);
                    cs.registerOutParameter(3, Types.VARCHAR);
                    cs.execute();
                    return cs.getString(3);
                }
        );
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "UPDATE_PARCEL_STATUS");
        res.put("type", "Stored Procedure");
        res.put("input", Map.of("parcelId", parcelId, "newStatus", newStatus));
        res.put("result", Map.of("statusMessage", message != null ? message : "Updated successfully"));
        res.put("message", message != null ? message : "Parcel status updated");
        res.put("executionTimeMs", duration);
        res.put("status", "SUCCESS");
        return res;
    }

    public Map<String, Object> runCalculateDeliveryCharge(double weightKg, double distanceKm, int serviceId) {
        long start = System.currentTimeMillis();
        Double charge = jdbcTemplate.execute(
                "{call CALCULATE_DELIVERY_CHARGE(?, ?, ?, ?)}",
                (CallableStatementCallback<Double>) cs -> {
                    cs.setDouble(1, weightKg);
                    cs.setDouble(2, distanceKm);
                    cs.setInt(3, serviceId);
                    cs.registerOutParameter(4, Types.DOUBLE);
                    cs.execute();
                    return cs.getDouble(4);
                }
        );
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "CALCULATE_DELIVERY_CHARGE");
        res.put("type", "Stored Procedure");
        res.put("input", Map.of("weightKg", weightKg, "distanceKm", distanceKm, "serviceId", serviceId));
        res.put("result", Map.of("finalCharge", charge != null ? charge : 0.0));
        res.put("message", String.format("Computed delivery charge: ₹%.2f (for %.1f kg over %.1f km)", charge != null ? charge : 0.0, weightKg, distanceKm));
        res.put("executionTimeMs", duration);
        res.put("status", "SUCCESS");
        return res;
    }

    public Map<String, Object> runCalculateDiscount(double amount) {
        long start = System.currentTimeMillis();
        Double discount = jdbcTemplate.execute(
                "{? = call CALCULATE_DISCOUNT(?)}",
                (CallableStatementCallback<Double>) cs -> {
                    cs.registerOutParameter(1, Types.DOUBLE);
                    cs.setDouble(2, amount);
                    cs.execute();
                    return cs.getDouble(1);
                }
        );
        long duration = System.currentTimeMillis() - start;

        double finalAmount = amount - (discount != null ? discount : 0.0);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "CALCULATE_DISCOUNT");
        res.put("type", "Stored Function (Return Value)");
        res.put("input", Map.of("originalAmount", amount));
        res.put("result", Map.of("discountAmount", discount != null ? discount : 0.0, "finalPayable", finalAmount));
        res.put("message", String.format("Calculated discount: ₹%.2f. Final payable amount: ₹%.2f", discount != null ? discount : 0.0, finalAmount));
        res.put("executionTimeMs", duration);
        res.put("status", "SUCCESS");
        return res;
    }

    public Map<String, Object> runProcessDeliveryAttempt(int branchId, int courierId, String status, String remarks) {
        long start = System.currentTimeMillis();
        String result = jdbcTemplate.execute(
                "{call PROCESS_DELIVERY_ATTEMPT(?, ?, ?, ?, ?)}",
                (CallableStatementCallback<String>) cs -> {
                    cs.setInt(1, branchId);
                    cs.setInt(2, courierId);
                    cs.setString(3, status);
                    cs.setString(4, remarks);
                    cs.registerOutParameter(5, Types.VARCHAR);
                    cs.execute();
                    return cs.getString(5);
                }
        );
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "PROCESS_DELIVERY_ATTEMPT");
        res.put("type", "Stored Procedure");
        res.put("input", Map.of("branchId", branchId, "courierId", courierId, "status", status, "remarks", remarks));
        res.put("result", Map.of("attemptResult", result != null ? result : "Recorded"));
        res.put("message", result != null ? result : "Delivery attempt recorded");
        res.put("executionTimeMs", duration);
        res.put("status", "SUCCESS");
        return res;
    }

    public Map<String, Object> runRecordPaymentTxn(int customerId, int orderId, double amount, String mode) {
        long start = System.currentTimeMillis();
        String result = jdbcTemplate.execute(
                "{call RECORD_PAYMENT_TXN(?, ?, ?, ?, ?)}",
                (CallableStatementCallback<String>) cs -> {
                    cs.setInt(1, customerId);
                    cs.setInt(2, orderId);
                    cs.setDouble(3, amount);
                    cs.setString(4, mode);
                    cs.registerOutParameter(5, Types.VARCHAR);
                    cs.execute();
                    return cs.getString(5);
                }
        );
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "RECORD_PAYMENT_TXN");
        res.put("type", "Transaction Procedure (COMMIT / ROLLBACK)");
        res.put("input", Map.of("customerId", customerId, "orderId", orderId, "amount", amount, "mode", mode));
        res.put("result", Map.of("transactionMessage", result != null ? result : "Completed"));
        res.put("message", result != null ? result : "Payment transaction completed");
        res.put("executionTimeMs", duration);
        res.put("status", result != null && result.startsWith("Error") ? "ERROR" : "SUCCESS");
        return res;
    }

    public Map<String, Object> runDemoExceptionHandling(int customerId, int orderId) {
        long start = System.currentTimeMillis();
        String result = jdbcTemplate.execute(
                "{call DEMO_EXCEPTION_HANDLING(?, ?, ?)}",
                (CallableStatementCallback<String>) cs -> {
                    cs.setInt(1, customerId);
                    cs.setInt(2, orderId);
                    cs.registerOutParameter(3, Types.VARCHAR);
                    cs.execute();
                    return cs.getString(3);
                }
        );
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "DEMO_EXCEPTION_HANDLING");
        res.put("type", "Exception Handling Procedure");
        res.put("input", Map.of("customerId", customerId, "orderId", orderId));
        res.put("result", Map.of("exceptionLog", result != null ? result : "Processed"));
        res.put("message", result != null ? result : "Procedure executed");
        res.put("executionTimeMs", duration);
        res.put("status", "SUCCESS");
        return res;
    }

    public Map<String, Object> runGenerateBranchReport(int branchId) {
        long start = System.currentTimeMillis();
        String report = jdbcTemplate.execute(
                "{call GENERATE_BRANCH_REPORT(?, ?)}",
                (CallableStatementCallback<String>) cs -> {
                    cs.setInt(1, branchId);
                    cs.registerOutParameter(2, Types.VARCHAR);
                    cs.execute();
                    return cs.getString(2);
                }
        );
        long duration = System.currentTimeMillis() - start;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("operation", "GENERATE_BRANCH_REPORT");
        res.put("type", "Cursor-Based Stored Procedure");
        res.put("input", Map.of("branchId", branchId));
        res.put("result", Map.of("reportText", report != null ? report : ""));
        res.put("message", "Generated report for Branch #" + branchId);
        res.put("executionTimeMs", duration);
        res.put("status", "SUCCESS");
        return res;
    }

    public List<Map<String, Object>> getDatabaseSchemaMetadata() {
        List<Map<String, Object>> tables = new ArrayList<>();

        tables.add(Map.of(
                "tableName", "CUSTOMER",
                "description", "Client accounts placing parcel delivery orders",
                "pk", "customer_id",
                "columns", List.of(
                        Map.of("name", "customer_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "name", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", false, "desc", "Full name of customer"),
                        Map.of("name", "email", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", true, "desc", "Contact email address"),
                        Map.of("name", "street", "type", "VARCHAR2(150)", "pk", false, "fk", false, "nullable", true, "desc", "Physical street address"),
                        Map.of("name", "city", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", true, "desc", "City of residence"),
                        Map.of("name", "pin", "type", "VARCHAR2(20)", "pk", false, "fk", false, "nullable", true, "desc", "Postal PIN code")
                ),
                "relationships", List.of(
                        Map.of("target", "ORDERS", "type", "1:N", "foreignKey", "customer_id", "desc", "Places one or more orders"),
                        Map.of("target", "PAYMENT", "type", "1:N", "foreignKey", "customer_id", "desc", "Makes one or more payments")
                )
        ));

        tables.add(Map.of(
                "tableName", "COURIER",
                "description", "Partner courier logistic firms and dispatch agencies",
                "pk", "courier_id",
                "columns", List.of(
                        Map.of("name", "courier_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "name", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", false, "desc", "Courier organization name"),
                        Map.of("name", "email", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", true, "desc", "Official contact email")
                ),
                "relationships", List.of(
                        Map.of("target", "COURIER_SERVICE", "type", "1:N", "foreignKey", "courier_id", "desc", "Offers courier services"),
                        Map.of("target", "PARCEL", "type", "1:N", "foreignKey", "courier_id", "desc", "Transports parcels"),
                        Map.of("target", "DELIVERY_BOY", "type", "1:1", "foreignKey", "courier_id", "desc", "Specialized subtype (Delivery Boy)"),
                        Map.of("target", "BRANCH_STAFF", "type", "1:1", "foreignKey", "courier_id", "desc", "Specialized subtype (Branch Staff)"),
                        Map.of("target", "DRIVER", "type", "1:1", "foreignKey", "courier_id", "desc", "Specialized subtype (Driver)")
                )
        ));

        tables.add(Map.of(
                "tableName", "BRANCH",
                "description", "Physical courier hubs, regional stations and dispatch centers",
                "pk", "branch_id",
                "columns", List.of(
                        Map.of("name", "branch_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "branch_name", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", false, "desc", "Official branch designation"),
                        Map.of("name", "street", "type", "VARCHAR2(150)", "pk", false, "fk", false, "nullable", true, "desc", "Hub street location"),
                        Map.of("name", "city", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", true, "desc", "Hub city"),
                        Map.of("name", "pin", "type", "VARCHAR2(20)", "pk", false, "fk", false, "nullable", true, "desc", "Hub postal PIN code")
                ),
                "relationships", List.of(
                        Map.of("target", "STAFF", "type", "1:N", "foreignKey", "branch_id", "desc", "Employs branch staff"),
                        Map.of("target", "COURIER_SERVICE", "type", "1:N", "foreignKey", "branch_id", "desc", "Hosts courier services"),
                        Map.of("target", "DELIVERY_ATTEMPT", "type", "1:N", "foreignKey", "branch_id", "desc", "Originates delivery attempts (Weak Entity)")
                )
        ));

        tables.add(Map.of(
                "tableName", "STAFF",
                "description", "Employees working across courier hub facilities",
                "pk", "staff_id",
                "columns", List.of(
                        Map.of("name", "staff_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "role", "type", "VARCHAR2(50)", "pk", false, "fk", false, "nullable", true, "desc", "Staff job position / role"),
                        Map.of("name", "branch_id", "type", "NUMBER", "pk", false, "fk", true, "target", "BRANCH(branch_id)", "nullable", true, "desc", "Foreign Key to assigned branch"),
                        Map.of("name", "name", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", false, "desc", "Staff member name"),
                        Map.of("name", "department", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", true, "desc", "Operational department")
                ),
                "relationships", List.of(
                        Map.of("target", "PARCEL", "type", "1:N", "foreignKey", "staff_id", "desc", "Handles parcel processing"),
                        Map.of("target", "VEHICLE", "type", "1:N", "foreignKey", "staff_id", "desc", "Operates assigned vehicle"),
                        Map.of("target", "MANAGER", "type", "1:1", "foreignKey", "staff_id", "desc", "Specialized subtype (Manager)"),
                        Map.of("target", "CUSTOMER_SUPPORT", "type", "1:1", "foreignKey", "staff_id", "desc", "Specialized subtype (Support)"),
                        Map.of("target", "ACCOUNTANT", "type", "1:1", "foreignKey", "staff_id", "desc", "Specialized subtype (Accountant)")
                )
        ));

        tables.add(Map.of(
                "tableName", "COURIER_SERVICE",
                "description", "Pricing and routing agreements between branches and courier partners",
                "pk", "service_id",
                "columns", List.of(
                        Map.of("name", "service_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "branch_id", "type", "NUMBER", "pk", false, "fk", true, "target", "BRANCH(branch_id)", "nullable", false, "desc", "Foreign Key to branch"),
                        Map.of("name", "courier_id", "type", "NUMBER", "pk", false, "fk", true, "target", "COURIER(courier_id)", "nullable", false, "desc", "Foreign Key to courier company"),
                        Map.of("name", "charges", "type", "NUMBER(10,2)", "pk", false, "fk", false, "nullable", true, "desc", "Base service delivery fee")
                ),
                "relationships", List.of(
                        Map.of("target", "ORDERS", "type", "1:N", "foreignKey", "service_id", "desc", "Utilized by orders")
                )
        ));

        tables.add(Map.of(
                "tableName", "ORDERS",
                "description", "Customer shipment booking orders tracking overall status and cost",
                "pk", "order_id",
                "columns", List.of(
                        Map.of("name", "order_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "customer_id", "type", "NUMBER", "pk", false, "fk", true, "target", "CUSTOMER(customer_id)", "nullable", false, "desc", "Foreign Key to customer"),
                        Map.of("name", "service_id", "type", "NUMBER", "pk", false, "fk", true, "target", "COURIER_SERVICE(service_id)", "nullable", true, "desc", "Foreign Key to courier service"),
                        Map.of("name", "order_date", "type", "TIMESTAMP", "pk", false, "fk", false, "nullable", true, "desc", "Timestamp of booking creation"),
                        Map.of("name", "status", "type", "VARCHAR2(50)", "pk", false, "fk", false, "nullable", true, "desc", "Status (Pending, In Transit, Delivered, Cancelled)"),
                        Map.of("name", "amount", "type", "NUMBER(10,2)", "pk", false, "fk", false, "nullable", true, "desc", "Total order monetary charge")
                ),
                "relationships", List.of(
                        Map.of("target", "PARCEL", "type", "1:1", "foreignKey", "order_id", "desc", "Contains physical parcel unit"),
                        Map.of("target", "PAYMENT", "type", "1:1", "foreignKey", "order_id", "desc", "Settled by payment record")
                )
        ));

        tables.add(Map.of(
                "tableName", "PARCEL",
                "description", "Physical package item associated with order and handling staff",
                "pk", "parcel_id",
                "columns", List.of(
                        Map.of("name", "parcel_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "order_id", "type", "NUMBER", "pk", false, "fk", true, "target", "ORDERS(order_id)", "nullable", false, "desc", "Foreign Key to order"),
                        Map.of("name", "price", "type", "NUMBER(10,2)", "pk", false, "fk", false, "nullable", true, "desc", "Declared package valuation"),
                        Map.of("name", "courier_id", "type", "NUMBER", "pk", false, "fk", true, "target", "COURIER(courier_id)", "nullable", true, "desc", "Foreign Key to courier partner"),
                        Map.of("name", "staff_id", "type", "NUMBER", "pk", false, "fk", true, "target", "STAFF(staff_id)", "nullable", true, "desc", "Foreign Key to handling staff")
                ),
                "relationships", List.of(
                        Map.of("target", "TRACKING_EVENT", "type", "1:N", "foreignKey", "parcel_id", "desc", "Has audit tracking events")
                )
        ));

        tables.add(Map.of(
                "tableName", "PAYMENT",
                "description", "Monetary transactions recording settlement of order fees",
                "pk", "payment_id",
                "columns", List.of(
                        Map.of("name", "payment_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "customer_id", "type", "NUMBER", "pk", false, "fk", true, "target", "CUSTOMER(customer_id)", "nullable", false, "desc", "Foreign Key to customer"),
                        Map.of("name", "order_id", "type", "NUMBER", "pk", false, "fk", true, "target", "ORDERS(order_id)", "nullable", false, "desc", "Foreign Key to order"),
                        Map.of("name", "amount", "type", "NUMBER(10,2)", "pk", false, "fk", false, "nullable", true, "desc", "Amount paid in INR"),
                        Map.of("name", "status", "type", "VARCHAR2(50)", "pk", false, "fk", false, "nullable", true, "desc", "Payment status (Paid, Pending, Refunded)")
                ),
                "relationships", List.of(
                        Map.of("target", "CASH_MODE", "type", "1:1", "foreignKey", "payment_id", "desc", "Specialized Cash subtype"),
                        Map.of("target", "CARD_MODE", "type", "1:1", "foreignKey", "payment_id", "desc", "Specialized Card subtype"),
                        Map.of("target", "ONLINE_MODE", "type", "1:1", "foreignKey", "payment_id", "desc", "Specialized Online subtype")
                )
        ));

        tables.add(Map.of(
                "tableName", "VEHICLE",
                "description", "Transportation fleet allocated to staff drivers",
                "pk", "vehicle_no",
                "columns", List.of(
                        Map.of("name", "vehicle_no", "type", "VARCHAR2(50)", "pk", true, "fk", false, "nullable", false, "desc", "Registration Plate (Primary Key)"),
                        Map.of("name", "license_no", "type", "VARCHAR2(50)", "pk", false, "fk", false, "nullable", true, "desc", "Driver license authorization number"),
                        Map.of("name", "staff_id", "type", "NUMBER", "pk", false, "fk", true, "target", "STAFF(staff_id)", "nullable", true, "desc", "Assigned Driver Staff ID")
                ),
                "relationships", Collections.emptyList()
        ));

        tables.add(Map.of(
                "tableName", "TRACKING_EVENT",
                "description", "Chronological audit milestone trail for in-transit parcels",
                "pk", "event_id",
                "columns", List.of(
                        Map.of("name", "event_id", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Primary Key identifier"),
                        Map.of("name", "parcel_id", "type", "NUMBER", "pk", false, "fk", true, "target", "PARCEL(parcel_id)", "nullable", false, "desc", "Foreign Key to parcel"),
                        Map.of("name", "event_type", "type", "VARCHAR2(100)", "pk", false, "fk", false, "nullable", true, "desc", "Event Milestone (Picked Up, In Transit, Delivered)"),
                        Map.of("name", "event_time", "type", "TIMESTAMP", "pk", false, "fk", false, "nullable", true, "desc", "Timestamp of event logging")
                ),
                "relationships", Collections.emptyList()
        ));

        tables.add(Map.of(
                "tableName", "DELIVERY_ATTEMPT",
                "description", "Weak Entity tracking individual delivery trials per branch",
                "pk", "(branch_id, attempt_no)",
                "columns", List.of(
                        Map.of("name", "branch_id", "type", "NUMBER", "pk", true, "fk", true, "target", "BRANCH(branch_id)", "nullable", false, "desc", "Composite PK part 1 & FK to Branch"),
                        Map.of("name", "attempt_no", "type", "NUMBER", "pk", true, "fk", false, "nullable", false, "desc", "Composite PK part 2 (Discriminator)"),
                        Map.of("name", "courier_id", "type", "NUMBER", "pk", false, "fk", true, "target", "COURIER(courier_id)", "nullable", true, "desc", "Assigned courier partner"),
                        Map.of("name", "attempt_time", "type", "TIMESTAMP", "pk", false, "fk", false, "nullable", true, "desc", "Timestamp of attempt"),
                        Map.of("name", "status", "type", "VARCHAR2(50)", "pk", false, "fk", false, "nullable", true, "desc", "Outcome status (Delivered, Pending, Failed)")
                ),
                "relationships", Collections.emptyList()
        ));

        return tables;
    }
}
