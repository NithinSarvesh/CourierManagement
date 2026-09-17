package com.courier.repository;

import com.courier.model.CardMode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class CardModeRepository {

    private final JdbcTemplate jdbcTemplate;

    public CardModeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CardMode> getAllCardModes() {
        return jdbcTemplate.query(
                "SELECT * FROM CARD_MODE ORDER BY payment_id",
                (rs, rowNum) -> new CardMode(rs.getInt("payment_id"))
        );
    }

    public int addCardMode(CardMode mode) {
        return jdbcTemplate.update(
                "INSERT INTO CARD_MODE (payment_id) VALUES (?)",
                mode.getPaymentId()
        );
    }

    public int updateCardMode(int id, CardMode mode) {
        return jdbcTemplate.update(
                "UPDATE CARD_MODE SET payment_id = ? WHERE payment_id = ?",
                mode.getPaymentId(), id
        );
    }

    public int deleteCardMode(int id) {
        return jdbcTemplate.update(
                "DELETE FROM CARD_MODE WHERE payment_id = ?", id
        );
    }
}