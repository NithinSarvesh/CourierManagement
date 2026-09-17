package com.courier.repository;

import com.courier.model.CashMode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class CashModeRepository {

    private final JdbcTemplate jdbcTemplate;

    public CashModeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CashMode> getAllCashModes() {
        return jdbcTemplate.query(
                "SELECT * FROM CASH_MODE ORDER BY payment_id",
                (rs, rowNum) -> new CashMode(rs.getInt("payment_id"))
        );
    }

    public int addCashMode(CashMode mode) {
        return jdbcTemplate.update(
                "INSERT INTO CASH_MODE (payment_id) VALUES (?)",
                mode.getPaymentId()
        );
    }

    public int updateCashMode(int id, CashMode mode) {
        return jdbcTemplate.update(
                "UPDATE CASH_MODE SET payment_id = ? WHERE payment_id = ?",
                mode.getPaymentId(), id
        );
    }

    public int deleteCashMode(int id) {
        return jdbcTemplate.update(
                "DELETE FROM CASH_MODE WHERE payment_id = ?", id
        );
    }
}