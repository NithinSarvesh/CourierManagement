package com.courier.repository;

import com.courier.model.Vehicle;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class VehicleRepository {

    private final JdbcTemplate jdbcTemplate;

    public VehicleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Vehicle> getAllVehicles() {
        String sql = "SELECT * FROM VEHICLE ORDER BY vehicle_no";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new Vehicle(
                rs.getString("vehicle_no"),
                rs.getString("license_no"),
                rs.getInt("staff_id")
        ));
    }

    public Vehicle getVehicleById(String vehicleNo) {
        String sql = "SELECT * FROM VEHICLE WHERE vehicle_no = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Vehicle(
                rs.getString("vehicle_no"),
                rs.getString("license_no"),
                rs.getInt("staff_id")
        ), vehicleNo);
    }

    public int addVehicle(Vehicle vehicle) {
        String sql = "INSERT INTO VEHICLE (vehicle_no, license_no, staff_id) VALUES (?, ?, ?)";

        return jdbcTemplate.update(
                sql,
                vehicle.getVehicleNo(),
                vehicle.getLicenseNo(),
                vehicle.getStaffId()
        );
    }

    public int updateVehicle(String vehicleNo, Vehicle vehicle) {
        String sql = "UPDATE VEHICLE SET license_no = ?, staff_id = ? WHERE vehicle_no = ?";

        return jdbcTemplate.update(
                sql,
                vehicle.getLicenseNo(),
                vehicle.getStaffId(),
                vehicleNo
        );
    }

    public int deleteVehicle(String vehicleNo) {
        String sql = "DELETE FROM VEHICLE WHERE vehicle_no = ?";

        return jdbcTemplate.update(sql, vehicleNo);
    }
}