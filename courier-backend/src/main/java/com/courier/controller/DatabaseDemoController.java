package com.courier.controller;

import com.courier.service.DatabaseDemoService;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/database")
public class DatabaseDemoController {

    private final DatabaseDemoService databaseDemoService;

    public DatabaseDemoController(DatabaseDemoService databaseDemoService) {
        this.databaseDemoService = databaseDemoService;
    }

    @GetMapping("/queries")
    public List<DatabaseDemoService.QueryMetadata> getAllQueries() {
        return databaseDemoService.getAvailableQueries();
    }

    @GetMapping("/query/{queryKey}")
    public Map<String, Object> executeQuery(@PathVariable String queryKey) {
        return databaseDemoService.executeNamedQuery(queryKey);
    }

    @PostMapping("/sql/execute")
    public Map<String, Object> executeCustomSql(@RequestBody Map<String, String> payload) {
        String sql = payload != null ? payload.get("sql") : "";
        return databaseDemoService.executeCustomSql(sql);
    }

    @GetMapping("/schema")
    public List<Map<String, Object>> getDatabaseSchema() {
        return databaseDemoService.getDatabaseSchemaMetadata();
    }

    @GetMapping("/plsql/operations")
    public List<Map<String, Object>> getPlsqlOperations() {
        List<Map<String, Object>> ops = new ArrayList<>();

        ops.add(Map.of(
                "id", "GET_CUSTOMER_ORDER_COUNT",
                "name", "Get Customer Order Count",
                "type", "Stored Procedure (IN / OUT)",
                "description", "Passes customer_id as IN parameter and returns order count via OUT parameter using GET_CUSTOMER_ORDER_COUNT.",
                "plsqlSignature", "PROCEDURE GET_CUSTOMER_ORDER_COUNT(p_customer_id IN NUMBER, p_count OUT NUMBER)",
                "fields", List.of(Map.of("name", "customerId", "label", "Customer ID", "type", "number", "default", 1001))
        ));

        ops.add(Map.of(
                "id", "UPDATE_PARCEL_STATUS",
                "name", "Update Parcel Status & Log Audit Event",
                "type", "Stored Procedure (DML & Audit)",
                "description", "Updates parcel and order status in ORDERS table and logs a new event into TRACKING_EVENT with CURRENT_TIMESTAMP.",
                "plsqlSignature", "PROCEDURE UPDATE_PARCEL_STATUS(p_parcel_id IN NUMBER, p_new_status IN VARCHAR2, p_message OUT VARCHAR2)",
                "fields", List.of(
                        Map.of("name", "parcelId", "label", "Parcel ID", "type", "number", "default", 6001),
                        Map.of("name", "newStatus", "label", "New Status", "type", "select", "options", List.of("In Transit", "Delivered", "Processing", "Cancelled"), "default", "Delivered")
                )
        ));

        ops.add(Map.of(
                "id", "CALCULATE_DELIVERY_CHARGE",
                "name", "Calculate Delivery Charge",
                "type", "Stored Procedure (Business Logic)",
                "description", "Computes total shipping tariff using base charge, service surcharge, package weight factor, and transit distance.",
                "plsqlSignature", "PROCEDURE CALCULATE_DELIVERY_CHARGE(p_weight_kg IN NUMBER, p_distance_km IN NUMBER, p_service_id IN NUMBER, p_final_charge OUT NUMBER)",
                "fields", List.of(
                        Map.of("name", "weightKg", "label", "Weight (kg)", "type", "number", "default", 4.5),
                        Map.of("name", "distanceKm", "label", "Distance (km)", "type", "number", "default", 85.0),
                        Map.of("name", "serviceId", "label", "Service ID", "type", "number", "default", 301)
                )
        ));

        ops.add(Map.of(
                "id", "CALCULATE_DISCOUNT",
                "name", "Calculate Order Discount",
                "type", "Stored Function (Return Value)",
                "description", "Demonstrates calling an Oracle stored function that evaluates tiers (15% for >= ₹2000, 10% for >= ₹1000) and returns a scalar number.",
                "plsqlSignature", "FUNCTION CALCULATE_DISCOUNT(p_amount IN NUMBER) RETURN NUMBER",
                "fields", List.of(
                        Map.of("name", "amount", "label", "Order Amount (₹)", "type", "number", "default", 2100.0)
                )
        ));

        ops.add(Map.of(
                "id", "PROCESS_DELIVERY_ATTEMPT",
                "name", "Process Delivery Attempt",
                "type", "Stored Procedure (Relational Insert)",
                "description", "Queries previous attempt count for branch, increments attempt_no, and logs delivery outcome with timestamp.",
                "plsqlSignature", "PROCEDURE PROCESS_DELIVERY_ATTEMPT(p_branch_id IN NUMBER, p_courier_id IN NUMBER, p_status IN VARCHAR2, p_remarks IN VARCHAR2, p_result OUT VARCHAR2)",
                "fields", List.of(
                        Map.of("name", "branchId", "label", "Branch ID", "type", "number", "default", 1),
                        Map.of("name", "courierId", "label", "Courier ID", "type", "number", "default", 101),
                        Map.of("name", "status", "label", "Attempt Status", "type", "select", "options", List.of("Delivered", "Pending", "Failed"), "default", "Delivered"),
                        Map.of("name", "remarks", "label", "Remarks", "type", "text", "default", "Package handed over with OTP verification")
                )
        ));

        ops.add(Map.of(
                "id", "RECORD_PAYMENT_TXN",
                "name", "Record Payment with Transaction Control",
                "type", "Transaction Procedure (COMMIT / ROLLBACK)",
                "description", "Demonstrates ACID transaction management: inserts into PAYMENT and payment mode subtype table, updates order status, and performs COMMIT or ROLLBACK.",
                "plsqlSignature", "PROCEDURE RECORD_PAYMENT_TXN(p_customer_id IN NUMBER, p_order_id IN NUMBER, p_amount IN NUMBER, p_mode IN VARCHAR2, p_result OUT VARCHAR2)",
                "fields", List.of(
                        Map.of("name", "customerId", "label", "Customer ID", "type", "number", "default", 1001),
                        Map.of("name", "orderId", "label", "Order ID", "type", "number", "default", 4005),
                        Map.of("name", "amount", "label", "Amount (₹)", "type", "number", "default", 1800.0),
                        Map.of("name", "mode", "label", "Payment Mode", "type", "select", "options", List.of("Cash", "Card", "Online"), "default", "Online")
                )
        ));

        ops.add(Map.of(
                "id", "DEMO_EXCEPTION_HANDLING",
                "name", "Demonstrate PL/SQL Exception Handling",
                "type", "Exception Handling Procedure",
                "description", "Demonstrates NO_DATA_FOUND and custom user exception handling when verifying customer and order records.",
                "plsqlSignature", "PROCEDURE DEMO_EXCEPTION_HANDLING(p_customer_id IN NUMBER, p_order_id IN NUMBER, p_result OUT VARCHAR2)",
                "fields", List.of(
                        Map.of("name", "customerId", "label", "Customer ID (Try 1001 or 9999 to test exception)", "type", "number", "default", 1001),
                        Map.of("name", "orderId", "label", "Order ID (Try 4001 or 9999 to test exception)", "type", "number", "default", 4001)
                )
        ));

        ops.add(Map.of(
                "id", "GENERATE_BRANCH_REPORT",
                "name", "Generate Branch Staff Report (Explicit Cursor)",
                "type", "Cursor-Based Stored Procedure",
                "description", "Demonstrates explicit PL/SQL cursor (OPEN, FETCH in loop, %NOTFOUND, CLOSE) iterating through branch staff roster.",
                "plsqlSignature", "PROCEDURE GENERATE_BRANCH_REPORT(p_branch_id IN NUMBER, p_report OUT VARCHAR2)",
                "fields", List.of(
                        Map.of("name", "branchId", "label", "Branch ID (1: Chennai, 2: Mumbai, 3: Bengaluru)", "type", "number", "default", 1)
                )
        ));

        return ops;
    }

    @PostMapping("/plsql/execute")
    public Map<String, Object> executePlsqlOperation(@RequestBody Map<String, Object> payload) {
        String operation = (String) payload.get("operation");
        if (operation == null) {
            throw new IllegalArgumentException("Missing 'operation' parameter");
        }

        switch (operation) {
            case "GET_CUSTOMER_ORDER_COUNT": {
                int customerId = Integer.parseInt(payload.getOrDefault("customerId", 1001).toString());
                return databaseDemoService.runGetCustomerOrderCount(customerId);
            }
            case "UPDATE_PARCEL_STATUS": {
                int parcelId = Integer.parseInt(payload.getOrDefault("parcelId", 6001).toString());
                String newStatus = payload.getOrDefault("newStatus", "Delivered").toString();
                return databaseDemoService.runUpdateParcelStatus(parcelId, newStatus);
            }
            case "CALCULATE_DELIVERY_CHARGE": {
                double weight = Double.parseDouble(payload.getOrDefault("weightKg", 2.0).toString());
                double distance = Double.parseDouble(payload.getOrDefault("distanceKm", 50.0).toString());
                int serviceId = Integer.parseInt(payload.getOrDefault("serviceId", 301).toString());
                return databaseDemoService.runCalculateDeliveryCharge(weight, distance, serviceId);
            }
            case "CALCULATE_DISCOUNT": {
                double amount = Double.parseDouble(payload.getOrDefault("amount", 1500.0).toString());
                return databaseDemoService.runCalculateDiscount(amount);
            }
            case "PROCESS_DELIVERY_ATTEMPT": {
                int branchId = Integer.parseInt(payload.getOrDefault("branchId", 1).toString());
                int courierId = Integer.parseInt(payload.getOrDefault("courierId", 101).toString());
                String status = payload.getOrDefault("status", "Delivered").toString();
                String remarks = payload.getOrDefault("remarks", "Delivery confirmed").toString();
                return databaseDemoService.runProcessDeliveryAttempt(branchId, courierId, status, remarks);
            }
            case "RECORD_PAYMENT_TXN": {
                int customerId = Integer.parseInt(payload.getOrDefault("customerId", 1001).toString());
                int orderId = Integer.parseInt(payload.getOrDefault("orderId", 4005).toString());
                double amount = Double.parseDouble(payload.getOrDefault("amount", 1800.0).toString());
                String mode = payload.getOrDefault("mode", "Online").toString();
                return databaseDemoService.runRecordPaymentTxn(customerId, orderId, amount, mode);
            }
            case "DEMO_EXCEPTION_HANDLING": {
                int customerId = Integer.parseInt(payload.getOrDefault("customerId", 1001).toString());
                int orderId = Integer.parseInt(payload.getOrDefault("orderId", 4001).toString());
                return databaseDemoService.runDemoExceptionHandling(customerId, orderId);
            }
            case "GENERATE_BRANCH_REPORT": {
                int branchId = Integer.parseInt(payload.getOrDefault("branchId", 1).toString());
                return databaseDemoService.runGenerateBranchReport(branchId);
            }
            default:
                throw new IllegalArgumentException("Unsupported PL/SQL operation: " + operation);
        }
    }
}
