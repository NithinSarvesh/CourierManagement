package com.courier.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final JdbcTemplate jdbcTemplate;

    public DashboardController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            Integer totalCustomers = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CUSTOMER", Integer.class);
            Integer totalOrders = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ORDERS", Integer.class);
            Integer totalParcels = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM PARCEL", Integer.class);
            Integer totalCouriers = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM COURIER", Integer.class);
            Integer totalBranches = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BRANCH", Integer.class);
            Integer totalStaff = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM STAFF", Integer.class);
            Integer totalVehicles = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM VEHICLE", Integer.class);
            Integer totalPayments = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM PAYMENT", Integer.class);
            Integer pendingDeliveries = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ORDERS WHERE status IN ('Pending', 'In Transit', 'Processing')", Integer.class);
            Double totalRevenue = jdbcTemplate.queryForObject("SELECT NVL(SUM(amount), 0) FROM ORDERS WHERE status <> 'Cancelled'", Double.class);

            String recentOrdersSql = "SELECT o.order_id, c.name as customer, TO_CHAR(o.order_date, 'DD Mon YYYY') as order_date, o.amount, o.status " +
                    "FROM ORDERS o LEFT JOIN CUSTOMER c ON o.customer_id = c.customer_id " +
                    "WHERE ROWNUM <= 5 ORDER BY o.order_id DESC";
            List<Map<String, Object>> recentOrders = jdbcTemplate.queryForList(recentOrdersSql);

            stats.put("totalCustomers", totalCustomers != null ? totalCustomers : 0);
            stats.put("totalOrders", totalOrders != null ? totalOrders : 0);
            stats.put("totalParcels", totalParcels != null ? totalParcels : 0);
            stats.put("totalCouriers", totalCouriers != null ? totalCouriers : 0);
            stats.put("totalBranches", totalBranches != null ? totalBranches : 0);
            stats.put("totalStaff", totalStaff != null ? totalStaff : 0);
            stats.put("totalVehicles", totalVehicles != null ? totalVehicles : 0);
            stats.put("totalPayments", totalPayments != null ? totalPayments : 0);
            stats.put("pendingDeliveries", pendingDeliveries != null ? pendingDeliveries : 0);
            stats.put("activeParcels", pendingDeliveries != null ? pendingDeliveries : 0);
            stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
            stats.put("recentOrders", recentOrders);
            stats.put("connected", true);
        } catch (Exception e) {
            stats.put("connected", false);
            stats.put("error", e.getMessage());
            stats.put("totalCustomers", 5);
            stats.put("totalOrders", 5);
            stats.put("totalParcels", 4);
            stats.put("totalCouriers", 4);
            stats.put("totalBranches", 4);
            stats.put("totalStaff", 5);
            stats.put("totalVehicles", 3);
            stats.put("totalPayments", 5);
            stats.put("pendingDeliveries", 3);
            stats.put("activeParcels", 3);
            stats.put("totalRevenue", 6490.0);
            stats.put("recentOrders", Collections.emptyList());
        }

        return stats;
    }
}
