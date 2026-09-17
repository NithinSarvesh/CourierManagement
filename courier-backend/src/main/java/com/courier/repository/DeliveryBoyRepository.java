package com.courier.repository;

import com.courier.model.DeliveryBoy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class DeliveryBoyRepository {

    private final JdbcTemplate jdbcTemplate;

    public DeliveryBoyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DeliveryBoy> getAllDeliveryBoys() {
        String sql = "SELECT * FROM DELIVERY_BOY ORDER BY courier_id";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new DeliveryBoy(
                rs.getInt("courier_id"),
                rs.getString("area_assigned")
        ));
    }

    public DeliveryBoy getDeliveryBoyById(int id) {
        String sql = "SELECT * FROM DELIVERY_BOY WHERE courier_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new DeliveryBoy(
                rs.getInt("courier_id"),
                rs.getString("area_assigned")
        ), id);
    }

    public int addDeliveryBoy(DeliveryBoy boy) {
        String sql = "INSERT INTO DELIVERY_BOY (courier_id, area_assigned) VALUES (?, ?)";
        return jdbcTemplate.update(sql, boy.getCourierId(), boy.getAreaAssigned());
    }

    public int updateDeliveryBoy(int id, DeliveryBoy boy) {
        String sql = "UPDATE DELIVERY_BOY SET area_assigned = ? WHERE courier_id = ?";
        return jdbcTemplate.update(sql, boy.getAreaAssigned(), id);
    }

    public int deleteDeliveryBoy(int id) {
        return jdbcTemplate.update("DELETE FROM DELIVERY_BOY WHERE courier_id = ?", id);
    }
}