package com.courier.repository;

import com.courier.model.Driver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class DriverRepository {

    private final JdbcTemplate jdbcTemplate;

    public DriverRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Driver> getAllDrivers() {
        String sql = "SELECT * FROM DRIVER ORDER BY courier_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new Driver(
                rs.getInt("courier_id"),
                rs.getString("license_no")
        ));
    }

    public Driver getDriverById(int id) {
        String sql = "SELECT * FROM DRIVER WHERE courier_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Driver(
                rs.getInt("courier_id"),
                rs.getString("license_no")
        ), id);
    }

    public int addDriver(Driver driver) {
        String sql = "INSERT INTO DRIVER (courier_id, license_no) VALUES (?, ?)";
        return jdbcTemplate.update(sql, driver.getCourierId(), driver.getLicenseNo());
    }

    public int updateDriver(int id, Driver driver) {
        String sql = "UPDATE DRIVER SET license_no = ? WHERE courier_id = ?";
        return jdbcTemplate.update(sql, driver.getLicenseNo(), id);
    }

    public int deleteDriver(int id) {
        return jdbcTemplate.update("DELETE FROM DRIVER WHERE courier_id = ?", id);
    }
}