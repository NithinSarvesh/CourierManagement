package com.courier.repository;

import com.courier.model.Branch;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class BranchRepository {

    private final JdbcTemplate jdbcTemplate;

    public BranchRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Branch> getAllBranches() {
        String sql = "SELECT branch_id, branch_name, street, city, pin FROM BRANCH";

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new Branch(
                        rs.getInt("branch_id"),
                        rs.getString("branch_name"),
                        rs.getString("street"),
                        rs.getString("city"),
                        rs.getString("pin")
                )
        );
    }

    public Branch getBranchById(int id) {
        String sql = "SELECT branch_id, branch_name, street, city, pin FROM BRANCH WHERE branch_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                new Branch(
                        rs.getInt("branch_id"),
                        rs.getString("branch_name"),
                        rs.getString("street"),
                        rs.getString("city"),
                        rs.getString("pin")
                ), id);
    }

    public int addBranch(Branch branch) {
        int id = branch.getBranchId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(branch_id), 0) + 1 FROM BRANCH", Integer.class);
            id = (nextId != null) ? nextId : 1;
            branch.setBranchId(id);
        }
        String sql = "INSERT INTO BRANCH (branch_id, branch_name, street, city, pin) VALUES (?, ?, ?, ?, ?)";

        return jdbcTemplate.update(sql,
                id,
                branch.getBranchName(),
                branch.getStreet(),
                branch.getCity(),
                branch.getPin());
    }

    public int updateBranch(int id, Branch branch) {
        String sql = "UPDATE BRANCH SET branch_name = ?, street = ?, city = ?, pin = ? WHERE branch_id = ?";

        return jdbcTemplate.update(sql,
                branch.getBranchName(),
                branch.getStreet(),
                branch.getCity(),
                branch.getPin(),
                id);
    }

    public int deleteBranch(int id) {
        String sql = "DELETE FROM BRANCH WHERE branch_id = ?";

        return jdbcTemplate.update(sql, id);
    }
}