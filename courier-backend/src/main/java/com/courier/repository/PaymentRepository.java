package com.courier.repository;

import com.courier.model.Payment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PaymentRepository {

    private final JdbcTemplate jdbcTemplate;

    public PaymentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Payment> getAllPayments() {
        String sql = "SELECT * FROM PAYMENT ORDER BY payment_id";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new Payment(
                rs.getInt("payment_id"),
                rs.getInt("customer_id"),
                rs.getInt("order_id"),
                rs.getDouble("amount"),
                rs.getString("status")
        ));
    }

    public Payment getPaymentById(int id) {
        String sql = "SELECT * FROM PAYMENT WHERE payment_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Payment(
                rs.getInt("payment_id"),
                rs.getInt("customer_id"),
                rs.getInt("order_id"),
                rs.getDouble("amount"),
                rs.getString("status")
        ), id);
    }

    public int addPayment(Payment payment) {
        int id = payment.getPaymentId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(payment_id), 5000) + 1 FROM PAYMENT", Integer.class);
            id = (nextId != null) ? nextId : 5001;
            payment.setPaymentId(id);
        }
        String sql = "INSERT INTO PAYMENT (payment_id, customer_id, order_id, amount, status) VALUES (?, ?, ?, ?, ?)";

        return jdbcTemplate.update(
                sql,
                id,
                payment.getCustomerId(),
                payment.getOrderId(),
                payment.getAmount(),
                payment.getStatus() != null ? payment.getStatus() : "Pending"
        );
    }

    public int updatePayment(int id, Payment payment) {
        String sql = "UPDATE PAYMENT SET customer_id = ?, order_id = ?, amount = ?, status = ? WHERE payment_id = ?";

        return jdbcTemplate.update(
                sql,
                payment.getCustomerId(),
                payment.getOrderId(),
                payment.getAmount(),
                payment.getStatus(),
                id
        );
    }

    public int deletePayment(int id) {
        String sql = "DELETE FROM PAYMENT WHERE payment_id = ?";

        return jdbcTemplate.update(sql, id);
    }

    public List<Payment> getPaymentsByOrderId(int orderId) {
    String sql = "SELECT * FROM PAYMENT WHERE order_id = ? ORDER BY payment_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Payment(
            rs.getInt("payment_id"),
            rs.getInt("customer_id"),
            rs.getInt("order_id"),
            rs.getDouble("amount"),
            rs.getString("status")
    ), orderId);
}
    public List<Payment> getPaymentsByCustomerId(int customerId) {
    String sql = "SELECT * FROM PAYMENT WHERE customer_id = ? ORDER BY payment_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Payment(
            rs.getInt("payment_id"),
            rs.getInt("customer_id"),
            rs.getInt("order_id"),
            rs.getDouble("amount"),
            rs.getString("status")
    ), customerId);
}
    public List<Payment> searchPayments(String status) {
    String sql = "SELECT * FROM PAYMENT WHERE LOWER(status) LIKE LOWER(?) ORDER BY payment_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Payment(
            rs.getInt("payment_id"),
            rs.getInt("customer_id"),
            rs.getInt("order_id"),
            rs.getDouble("amount"),
            rs.getString("status")
    ), "%" + status + "%");
}
}