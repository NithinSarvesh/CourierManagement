package com.courier.repository;

import com.courier.model.CustomerSupport;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class CustomerSupportRepository {

    private final JdbcTemplate jdbcTemplate;

    public CustomerSupportRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CustomerSupport> getAllCustomerSupport() {
        String sql = "SELECT * FROM CUSTOMER_SUPPORT ORDER BY staff_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CustomerSupport(
                rs.getInt("staff_id"),
                rs.getString("staff_timing")
        ));
    }

    public CustomerSupport getCustomerSupportById(int id) {
        String sql = "SELECT * FROM CUSTOMER_SUPPORT WHERE staff_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new CustomerSupport(
                rs.getInt("staff_id"),
                rs.getString("staff_timing")
        ), id);
    }

    public int addCustomerSupport(CustomerSupport support) {
        String sql = "INSERT INTO CUSTOMER_SUPPORT (staff_id, staff_timing) VALUES (?, ?)";
        return jdbcTemplate.update(sql, support.getStaffId(), support.getStaffTiming());
    }

    public int updateCustomerSupport(int id, CustomerSupport support) {
        String sql = "UPDATE CUSTOMER_SUPPORT SET staff_timing = ? WHERE staff_id = ?";
        return jdbcTemplate.update(sql, support.getStaffTiming(), id);
    }

    public int deleteCustomerSupport(int id) {
        return jdbcTemplate.update("DELETE FROM CUSTOMER_SUPPORT WHERE staff_id = ?", id);
    }
}