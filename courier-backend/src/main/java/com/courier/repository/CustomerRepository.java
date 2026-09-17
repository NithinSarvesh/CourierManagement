package com.courier.repository;

import com.courier.model.Customer;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CustomerRepository {

    private final JdbcTemplate jdbcTemplate;

    public CustomerRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Customer> getAllCustomers() {
        String sql = "SELECT customer_id, name, email, street, city, pin FROM CUSTOMER";

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new Customer(
                        rs.getInt("customer_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("street"),
                        rs.getString("city"),
                        rs.getString("pin")
                )
        );
    }

    public Customer getCustomerById(int id) {
        String sql = "SELECT customer_id, name, email, street, city, pin FROM CUSTOMER WHERE customer_id = ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                new Customer(
                        rs.getInt("customer_id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("street"),
                        rs.getString("city"),
                        rs.getString("pin")
                ), id);
    }

    public int addCustomer(Customer customer) {
        int id = customer.getCustomerId();
        if (id <= 0) {
            Integer nextId = jdbcTemplate.queryForObject("SELECT NVL(MAX(customer_id), 1000) + 1 FROM CUSTOMER", Integer.class);
            id = (nextId != null) ? nextId : 1001;
            customer.setCustomerId(id);
        }
        String sql = "INSERT INTO CUSTOMER (customer_id, name, email, street, city, pin) VALUES (?, ?, ?, ?, ?, ?)";

        return jdbcTemplate.update(sql,
                id,
                customer.getName(),
                customer.getEmail(),
                customer.getStreet(),
                customer.getCity(),
                customer.getPin());
    }

    public int updateCustomer(int id, Customer customer) {
        String sql = "UPDATE CUSTOMER SET name = ?, email = ?, street = ?, city = ?, pin = ? WHERE customer_id = ?";

        return jdbcTemplate.update(sql,
                customer.getName(),
                customer.getEmail(),
                customer.getStreet(),
                customer.getCity(),
                customer.getPin(),
                id);
    }

    public int deleteCustomer(int id) {
        String sql = "DELETE FROM CUSTOMER WHERE customer_id = ?";

        return jdbcTemplate.update(sql, id);
    }

    public List<Customer> searchCustomers(String name) {
        String sql = "SELECT customer_id, name, email, street, city, pin FROM CUSTOMER WHERE LOWER(name) LIKE LOWER(?)";

        return jdbcTemplate.query(sql, (rs, rowNum) ->
            new Customer(
                    rs.getInt("customer_id"),
                    rs.getString("name"),
                    rs.getString("email"),
                    rs.getString("street"),
                    rs.getString("city"),
                    rs.getString("pin")
            ), "%" + name + "%");
    }
}