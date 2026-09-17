package com.courier.repository;

import com.courier.model.Manager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class ManagerRepository {

    private final JdbcTemplate jdbcTemplate;

    public ManagerRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Manager> getAllManagers() {
        String sql = "SELECT * FROM MANAGER ORDER BY staff_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new Manager(
                rs.getInt("staff_id"),
                rs.getInt("manager_id")
        ));
    }

    public Manager getManagerById(int id) {
        String sql = "SELECT * FROM MANAGER WHERE staff_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Manager(
                rs.getInt("staff_id"),
                rs.getInt("manager_id")
        ), id);
    }

    public int addManager(Manager manager) {
        String sql = "INSERT INTO MANAGER (staff_id, manager_id) VALUES (?, ?)";
        return jdbcTemplate.update(sql, manager.getStaffId(), manager.getManagerId());
    }

    public int updateManager(int id, Manager manager) {
        String sql = "UPDATE MANAGER SET manager_id = ? WHERE staff_id = ?";
        return jdbcTemplate.update(sql, manager.getManagerId(), id);
    }

    public int deleteManager(int id) {
        return jdbcTemplate.update("DELETE FROM MANAGER WHERE staff_id = ?", id);
    }
}