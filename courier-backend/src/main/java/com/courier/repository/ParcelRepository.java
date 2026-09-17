package com.courier.repository;

import com.courier.model.Parcel;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ParcelRepository {

    private final JdbcTemplate jdbcTemplate;

    public ParcelRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Parcel> getAllParcels() {
        String sql = "SELECT * FROM PARCEL ORDER BY parcel_id";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new Parcel(
                rs.getInt("parcel_id"),
                rs.getInt("order_id"),
                rs.getDouble("price"),
                rs.getInt("courier_id"),
                rs.getInt("staff_id")
        ));
    }

    public Parcel getParcelById(int id) {
        String sql = "SELECT * FROM PARCEL WHERE parcel_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Parcel(
                rs.getInt("parcel_id"),
                rs.getInt("order_id"),
                rs.getDouble("price"),
                rs.getInt("courier_id"),
                rs.getInt("staff_id")
        ), id);
    }

    public int addParcel(Parcel parcel) {
        int id = parcel.getParcelId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(parcel_id), 6000) + 1 FROM PARCEL", Integer.class);
            id = (nextId != null) ? nextId : 6001;
            parcel.setParcelId(id);
        }
        String sql = "INSERT INTO PARCEL (parcel_id, order_id, price, courier_id, staff_id) VALUES (?, ?, ?, ?, ?)";

        return jdbcTemplate.update(
                sql,
                id,
                parcel.getOrderId(),
                parcel.getPrice(),
                parcel.getCourierId() > 0 ? parcel.getCourierId() : null,
                parcel.getStaffId() > 0 ? parcel.getStaffId() : null
        );
    }

    public int updateParcel(int id, Parcel parcel) {
        String sql = "UPDATE PARCEL SET order_id = ?, price = ?, courier_id = ?, staff_id = ? WHERE parcel_id = ?";

        return jdbcTemplate.update(
                sql,
                parcel.getOrderId(),
                parcel.getPrice(),
                parcel.getCourierId(),
                parcel.getStaffId(),
                id
        );
    }

    public int deleteParcel(int id) {
        String sql = "DELETE FROM PARCEL WHERE parcel_id = ?";

        return jdbcTemplate.update(sql, id);
    }

    public List<Parcel> getParcelsByCourierId(int courierId) {
    String sql = "SELECT * FROM PARCEL WHERE courier_id = ? ORDER BY parcel_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Parcel(
            rs.getInt("parcel_id"),
            rs.getInt("order_id"),
            rs.getDouble("price"),
            rs.getInt("courier_id"),
            rs.getInt("staff_id")
    ), courierId);
}

    public List<Parcel> getParcelsByOrderId(int orderId) {
    String sql = "SELECT * FROM PARCEL WHERE order_id = ? ORDER BY parcel_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Parcel(
            rs.getInt("parcel_id"),
            rs.getInt("order_id"),
            rs.getDouble("price"),
            rs.getInt("courier_id"),
            rs.getInt("staff_id")
    ), orderId);
}
    public List<Parcel> searchParcelsByCourier(int courierId) {
    String sql = "SELECT * FROM PARCEL WHERE courier_id = ? ORDER BY parcel_id";

    return jdbcTemplate.query(sql, (rs, rowNum) -> new Parcel(
            rs.getInt("parcel_id"),
            rs.getInt("order_id"),
            rs.getDouble("price"),
            rs.getInt("courier_id"),
            rs.getInt("staff_id")
    ), courierId);
}
}