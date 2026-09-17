package com.courier.repository;

import com.courier.model.DeliveryAttempt;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;

@Repository
public class DeliveryAttemptRepository {

    private final JdbcTemplate jdbcTemplate;

    public DeliveryAttemptRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DeliveryAttempt> getAllDeliveryAttempts() {
        String sql = "SELECT * FROM DELIVERY_ATTEMPT ORDER BY branch_id, attempt_no";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new DeliveryAttempt(
                rs.getInt("branch_id"),
                rs.getInt("courier_id"),
                rs.getInt("attempt_no"),
                rs.getTimestamp("attempt_time").toLocalDateTime(),
                rs.getString("status")
        ));
    }

    public int addDeliveryAttempt(DeliveryAttempt attempt) {
        int attemptNo = attempt.getAttemptNo();
        if (attemptNo <= 0) {
            Integer nextNo = jdbcTemplate.queryForObject("SELECT NVL(MAX(attempt_no), 0) + 1 FROM DELIVERY_ATTEMPT WHERE branch_id = ?", Integer.class, attempt.getBranchId());
            attemptNo = (nextNo != null) ? nextNo : 1;
            attempt.setAttemptNo(attemptNo);
        }
        java.time.LocalDateTime at = attempt.getAttemptTime() != null ? attempt.getAttemptTime() : java.time.LocalDateTime.now();
        attempt.setAttemptTime(at);

        String sql = "INSERT INTO DELIVERY_ATTEMPT (branch_id, courier_id, attempt_no, attempt_time, status) VALUES (?, ?, ?, ?, ?)";

        return jdbcTemplate.update(
                sql,
                attempt.getBranchId(),
                attempt.getCourierId() > 0 ? attempt.getCourierId() : null,
                attemptNo,
                Timestamp.valueOf(at),
                attempt.getStatus() != null ? attempt.getStatus() : "Pending"
        );
    }

    public int updateDeliveryAttempt(int branchId, int attemptNo, DeliveryAttempt attempt) {
        String sql = "UPDATE DELIVERY_ATTEMPT SET courier_id = ?, attempt_time = ?, status = ? WHERE branch_id = ? AND attempt_no = ?";

        return jdbcTemplate.update(
                sql,
                attempt.getCourierId(),
                Timestamp.valueOf(attempt.getAttemptTime()),
                attempt.getStatus(),
                branchId,
                attemptNo
        );
    }

    public int deleteDeliveryAttempt(int branchId, int attemptNo) {
        String sql = "DELETE FROM DELIVERY_ATTEMPT WHERE branch_id = ? AND attempt_no = ?";

        return jdbcTemplate.update(sql, branchId, attemptNo);
    }
}