package com.courier.repository;

import com.courier.model.OnlineMode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class OnlineModeRepository {

    private final JdbcTemplate jdbcTemplate;

    public OnlineModeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<OnlineMode> getAllOnlineModes() {
        return jdbcTemplate.query(
                "SELECT * FROM ONLINE_MODE ORDER BY payment_id",
                (rs, rowNum) -> new OnlineMode(rs.getInt("payment_id"))
        );
    }

    public int addOnlineMode(OnlineMode mode) {
        return jdbcTemplate.update(
                "INSERT INTO ONLINE_MODE (payment_id) VALUES (?)",
                mode.getPaymentId()
        );
    }

    public int updateOnlineMode(int id, OnlineMode mode) {
        return jdbcTemplate.update(
                "UPDATE ONLINE_MODE SET payment_id = ? WHERE payment_id = ?",
                mode.getPaymentId(), id
        );
    }

    public int deleteOnlineMode(int id) {
        return jdbcTemplate.update(
                "DELETE FROM ONLINE_MODE WHERE payment_id = ?", id
        );
    }
}