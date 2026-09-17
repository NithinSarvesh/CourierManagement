package com.courier.repository;

import com.courier.model.BranchStaff;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class BranchStaffRepository {

    private final JdbcTemplate jdbcTemplate;

    public BranchStaffRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BranchStaff> getAllBranchStaff() {
        String sql = "SELECT * FROM BRANCH_STAFF ORDER BY courier_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new BranchStaff(
                rs.getInt("courier_id"),
                rs.getString("department")
        ));
    }

    public BranchStaff getBranchStaffById(int id) {
        String sql = "SELECT * FROM BRANCH_STAFF WHERE courier_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new BranchStaff(
                rs.getInt("courier_id"),
                rs.getString("department")
        ), id);
    }

    public int addBranchStaff(BranchStaff staff) {
        String sql = "INSERT INTO BRANCH_STAFF (courier_id, department) VALUES (?, ?)";
        return jdbcTemplate.update(sql, staff.getCourierId(), staff.getDepartment());
    }

    public int updateBranchStaff(int id, BranchStaff staff) {
        String sql = "UPDATE BRANCH_STAFF SET department = ? WHERE courier_id = ?";
        return jdbcTemplate.update(sql, staff.getDepartment(), id);
    }

    public int deleteBranchStaff(int id) {
        return jdbcTemplate.update("DELETE FROM BRANCH_STAFF WHERE courier_id = ?", id);
    }
    public List<BranchStaff> searchBranchStaff(String department) {
    String sql = "SELECT * FROM BRANCH_STAFF WHERE LOWER(department) LIKE LOWER(?) ORDER BY courier_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new BranchStaff(
            rs.getInt("courier_id"),
            rs.getString("department")
    ), "%" + department + "%");
}
}