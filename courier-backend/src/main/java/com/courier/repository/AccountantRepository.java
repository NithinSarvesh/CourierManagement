package com.courier.repository;

import com.courier.model.Accountant;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class AccountantRepository {

    private final JdbcTemplate jdbcTemplate;

    public AccountantRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Accountant> getAllAccountants() {
        String sql = "SELECT * FROM ACCOUNTANT ORDER BY staff_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new Accountant(
                rs.getInt("staff_id"),
                rs.getString("qualification")
        ));
    }

    public Accountant getAccountantById(int id) {
        String sql = "SELECT * FROM ACCOUNTANT WHERE staff_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Accountant(
                rs.getInt("staff_id"),
                rs.getString("qualification")
        ), id);
    }

    public int addAccountant(Accountant accountant) {
        String sql = "INSERT INTO ACCOUNTANT (staff_id, qualification) VALUES (?, ?)";
        return jdbcTemplate.update(sql, accountant.getStaffId(), accountant.getQualification());
    }

    public int updateAccountant(int id, Accountant accountant) {
        String sql = "UPDATE ACCOUNTANT SET qualification = ? WHERE staff_id = ?";
        return jdbcTemplate.update(sql, accountant.getQualification(), id);
    }

    public int deleteAccountant(int id) {
        return jdbcTemplate.update("DELETE FROM ACCOUNTANT WHERE staff_id = ?", id);
    }
}