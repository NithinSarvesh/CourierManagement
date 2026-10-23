package com.courier.repository;

import com.courier.model.Customer;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends Neo4jRepository<Customer, String> {

    @Query("MATCH (c:Customer {customerId: $customerId}) RETURN c")
    Optional<Customer> findByCustomerId(@Param("customerId") String customerId);

    @Query("MATCH (c:Customer {email: $email}) RETURN c")
    Optional<Customer> findByEmail(@Param("email") String email);

    @Query("MATCH (c:Customer {phone: $phone}) RETURN c")
    Optional<Customer> findByPhone(@Param("phone") String phone);

    @Query("MATCH (c:Customer) " +
           "WHERE toLower(c.name) CONTAINS toLower($query) " +
           "   OR toLower(c.email) CONTAINS toLower($query) " +
           "   OR c.phone CONTAINS $query " +
           "RETURN c ORDER BY c.name ASC")
    List<Customer> searchCustomers(@Param("query") String query);

    @Query("MATCH (c:Customer) RETURN c ORDER BY c.customerId ASC SKIP $skip LIMIT $limit")
    List<Customer> findAllPaged(@Param("skip") long skip, @Param("limit") int limit);

    @Query("MATCH (c:Customer) RETURN count(c)")
    long countAllCustomers();

    @Query("MATCH (c:Customer {customerId: $customerId})-[:BOOKED]->(p:Parcel) RETURN count(p)")
    long countParcelsBookedByCustomer(@Param("customerId") String customerId);

    @Query("MATCH (c:Customer {customerId: $customerId})-[:RAISED]->(t:SupportTicket) RETURN count(t)")
    long countTicketsRaisedByCustomer(@Param("customerId") String customerId);

    @Query("MERGE (c:Customer {customerId: $customerId}) " +
           "ON CREATE SET c.name = $name, c.email = $email, c.phone = $phone, c.address = $address " +
           "ON MATCH SET c.name = $name, c.email = $email, c.phone = $phone, c.address = $address " +
           "RETURN c")
    Customer saveOrUpdateCustomer(@Param("customerId") String customerId,
                                  @Param("name") String name,
                                  @Param("email") String email,
                                  @Param("phone") String phone,
                                  @Param("address") String address);

    @Query("MATCH (c:Customer {customerId: $customerId}) DETACH DELETE c")
    void deleteCustomerById(@Param("customerId") String customerId);
}
