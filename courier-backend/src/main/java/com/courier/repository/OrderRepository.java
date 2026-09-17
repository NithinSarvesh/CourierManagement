package com.courier.repository;

import com.courier.model.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public class OrderRepository {

    private final JdbcTemplate jdbcTemplate;

    public OrderRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Order> getAllOrders() {
        String sql = "SELECT * FROM ORDERS ORDER BY order_id";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new Order(
                rs.getInt("order_id"),
                rs.getInt("customer_id"),
                rs.getInt("service_id"),
                rs.getTimestamp("order_date").toLocalDateTime(),
                rs.getString("status"),
                rs.getDouble("amount")
        ));
    }

    public Order getOrderById(int id) {
        String sql = "SELECT * FROM ORDERS WHERE order_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Order(
                rs.getInt("order_id"),
                rs.getInt("customer_id"),
                rs.getInt("service_id"),
                rs.getTimestamp("order_date").toLocalDateTime(),
                rs.getString("status"),
                rs.getDouble("amount")
        ), id);
    }

    public int addOrder(Order order) {
        int id = order.getOrderId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(order_id), 4000) + 1 FROM ORDERS", Integer.class);
            id = (nextId != null) ? nextId : 4001;
            order.setOrderId(id);
        }
        java.time.LocalDateTime od = order.getOrderDate() != null ? order.getOrderDate() : java.time.LocalDateTime.now();
        order.setOrderDate(od);

        String sql = "INSERT INTO ORDERS (order_id, customer_id, service_id, order_date, status, amount) VALUES (?, ?, ?, ?, ?, ?)";

        return jdbcTemplate.update(
                sql,
                id,
                order.getCustomerId(),
                order.getServiceId() > 0 ? order.getServiceId() : null,
                Timestamp.valueOf(od),
                order.getStatus() != null ? order.getStatus() : "Pending",
                order.getAmount()
        );
    }

    public int updateOrder(int id, Order order) {
        java.time.LocalDateTime od = order.getOrderDate() != null ? order.getOrderDate() : java.time.LocalDateTime.now();
        String sql = "UPDATE ORDERS SET customer_id = ?, service_id = ?, order_date = ?, status = ?, amount = ? WHERE order_id = ?";

        return jdbcTemplate.update(
                sql,
                order.getCustomerId(),
                order.getServiceId() > 0 ? order.getServiceId() : null,
                Timestamp.valueOf(od),
                order.getStatus() != null ? order.getStatus() : "Pending",
                order.getAmount(),
                id
        );
    }

    public int deleteOrder(int id) {
        String sql = "DELETE FROM ORDERS WHERE order_id = ?";

        return jdbcTemplate.update(sql, id);
    }

    public List<Order> getOrdersByCustomerId(int customerId) {
    String sql = "SELECT * FROM ORDERS WHERE customer_id = ? ORDER BY order_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Order(
            rs.getInt("order_id"),
            rs.getInt("customer_id"),
            rs.getInt("service_id"),
            rs.getTimestamp("order_date").toLocalDateTime(),
            rs.getString("status"),
            rs.getDouble("amount")
    ), customerId);
}
    public List<Order> searchOrders(String status) {
    String sql = "SELECT * FROM ORDERS WHERE LOWER(status) LIKE LOWER(?) ORDER BY order_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Order(
            rs.getInt("order_id"),
            rs.getInt("customer_id"),
            rs.getInt("service_id"),
            rs.getTimestamp("order_date").toLocalDateTime(),
            rs.getString("status"),
            rs.getDouble("amount")
    ), "%" + status + "%");
}
}