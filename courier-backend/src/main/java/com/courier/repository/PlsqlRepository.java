package com.courier.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.CallableStatementCallback;

import java.sql.Types;

import org.springframework.stereotype.Repository;

@Repository
public class PlsqlRepository {

    private final JdbcTemplate jdbcTemplate;

    public PlsqlRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int getCustomerOrderCount(int customerId) {
        return jdbcTemplate.execute(
            "{call GET_CUSTOMER_ORDER_COUNT(?, ?)}",
            (CallableStatementCallback<Integer>) cs -> {
                cs.setInt(1, customerId);
                cs.registerOutParameter(2, Types.INTEGER);
                cs.execute();
                return cs.getInt(2);
            }
        );
    }
}