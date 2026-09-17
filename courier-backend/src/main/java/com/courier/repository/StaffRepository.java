package com.courier.repository;

import com.courier.model.Staff;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class StaffRepository {

    private final JdbcTemplate jdbcTemplate;

    public StaffRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Staff> getAllStaff() {
        String sql = "SELECT staff_id, role, branch_id, name, department FROM STAFF";

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new Staff(
                        rs.getInt("staff_id"),
                        rs.getString("role"),
                        rs.getInt("branch_id"),
                        rs.getString("name"),
                        rs.getString("department")
                )
        );
    }

    public Staff getStaffById(int id) {
        String sql = "SELECT staff_id, role, branch_id, name, department FROM STAFF WHERE staff_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                new Staff(
                        rs.getInt("staff_id"),
                        rs.getString("role"),
                        rs.getInt("branch_id"),
                        rs.getString("name"),
                        rs.getString("department")
                ), id);
    }

    public int addStaff(Staff staff) {
        int id = staff.getStaffId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(staff_id), 200) + 1 FROM STAFF", Integer.class);
            id = (nextId != null) ? nextId : 201;
            staff.setStaffId(id);
        }
        String sql = "INSERT INTO STAFF (staff_id, role, branch_id, name, department) VALUES (?, ?, ?, ?, ?)";

        return jdbcTemplate.update(sql,
                id,
                staff.getRole(),
                staff.getBranchId() > 0 ? staff.getBranchId() : null,
                staff.getName(),
                staff.getDepartment());
    }

    public int updateStaff(int id, Staff staff) {
        String sql = "UPDATE STAFF SET role = ?, branch_id = ?, name = ?, department = ? WHERE staff_id = ?";

        return jdbcTemplate.update(sql,
                staff.getRole(),
                staff.getBranchId(),
                staff.getName(),
                staff.getDepartment(),
                id);
    }

    public int deleteStaff(int id) {
        String sql = "DELETE FROM STAFF WHERE staff_id = ?";

        return jdbcTemplate.update(sql, id);
    }
    public List<Staff> searchStaff(String role) {
    String sql = "SELECT staff_id, role, branch_id, name, department FROM STAFF WHERE LOWER(role) LIKE LOWER(?)";

    return jdbcTemplate.query(sql, (rs, rowNum) ->
            new Staff(
                    rs.getInt("staff_id"),
                    rs.getString("role"),
                    rs.getInt("branch_id"),
                    rs.getString("name"),
                    rs.getString("department")
            ), "%" + role + "%");
}

    public List<Staff> getStaffByBranchId(int branchId) {
    String sql = "SELECT staff_id, role, branch_id, name, department FROM STAFF WHERE branch_id = ? ORDER BY staff_id";

    return jdbcTemplate.query(sql, (rs, rowNum) ->
            new Staff(
                    rs.getInt("staff_id"),
                    rs.getString("role"),
                    rs.getInt("branch_id"),
                    rs.getString("name"),
                    rs.getString("department")
            ), branchId);
}
}