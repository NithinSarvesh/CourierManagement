package com.courier.repository;

import com.courier.model.CourierService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CourierServiceRepository {

    private final JdbcTemplate jdbcTemplate;

    public CourierServiceRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CourierService> getAllServices() {
        String sql = "SELECT service_id, branch_id, courier_id, charges FROM COURIER_SERVICE";

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new CourierService(
                        rs.getInt("service_id"),
                        rs.getInt("branch_id"),
                        rs.getInt("courier_id"),
                        rs.getDouble("charges")
                )
        );
    }

    public CourierService getServiceById(int id) {
        String sql = "SELECT service_id, branch_id, courier_id, charges FROM COURIER_SERVICE WHERE service_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                new CourierService(
                        rs.getInt("service_id"),
                        rs.getInt("branch_id"),
                        rs.getInt("courier_id"),
                        rs.getDouble("charges")
                ), id);
    }

    public int addService(CourierService service) {
        int id = service.getServiceId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(service_id), 300) + 1 FROM COURIER_SERVICE", Integer.class);
            id = (nextId != null) ? nextId : 301;
            service.setServiceId(id);
        }
        String sql = "INSERT INTO COURIER_SERVICE (service_id, branch_id, courier_id, charges) VALUES (?, ?, ?, ?)";

        return jdbcTemplate.update(sql,
                id,
                service.getBranchId(),
                service.getCourierId(),
                service.getCharges());
    }

    public int updateService(int id, CourierService service) {
        String sql = "UPDATE COURIER_SERVICE SET branch_id = ?, courier_id = ?, charges = ? WHERE service_id = ?";

        return jdbcTemplate.update(sql,
                service.getBranchId(),
                service.getCourierId(),
                service.getCharges(),
                id);
    }

    public int deleteService(int id) {
        String sql = "DELETE FROM COURIER_SERVICE WHERE service_id = ?";

        return jdbcTemplate.update(sql, id);
    }

        public List<CourierService> getServicesByBranchId(int branchId) {
    String sql = "SELECT * FROM COURIER_SERVICE WHERE branch_id = ? ORDER BY service_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new CourierService(
            rs.getInt("service_id"),
            rs.getInt("branch_id"),
            rs.getInt("courier_id"),
            rs.getDouble("charges")
    ), branchId);
}
}