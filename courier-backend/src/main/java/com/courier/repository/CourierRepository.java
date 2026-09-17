package com.courier.repository;

import com.courier.model.Courier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CourierRepository {

    private final JdbcTemplate jdbcTemplate;

    public CourierRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Courier> getAllCouriers() {
        String sql = "SELECT * FROM COURIER ORDER BY courier_id";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new Courier(
            rs.getInt("courier_id"),
            rs.getString("name"),
            rs.getString("email")
        ));
    }

    public Courier getCourierById(int id) {
        String sql = "SELECT * FROM COURIER WHERE courier_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Courier(
            rs.getInt("courier_id"),
            rs.getString("name"),
            rs.getString("email")
        ), id);
    }

    public int addCourier(Courier courier) {
        int id = courier.getCourierId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(courier_id), 100) + 1 FROM COURIER", Integer.class);
            id = (nextId != null) ? nextId : 101;
            courier.setCourierId(id);
        }
        String sql = "INSERT INTO COURIER (courier_id, name, email) VALUES (?, ?, ?)";

        return jdbcTemplate.update(
            sql,
            id,
            courier.getName(),
            courier.getEmail()
        );
    }

    public int updateCourier(int id, Courier courier) {
        String sql = "UPDATE COURIER SET name = ?, email = ? WHERE courier_id = ?";

        return jdbcTemplate.update(
            sql,
            courier.getName(),
            courier.getEmail(),
            id
        );
    }

    public int deleteCourier(int id) {
        String sql = "DELETE FROM COURIER WHERE courier_id = ?";

        return jdbcTemplate.update(sql, id);
    }
    public List<Courier> searchCouriers(String name) {
        String sql = "SELECT * FROM COURIER WHERE LOWER(name) LIKE LOWER(?) ORDER BY courier_id";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new Courier(
                rs.getInt("courier_id"),
                rs.getString("name"),
                rs.getString("email")
        ), "%" + name + "%");
    }
}