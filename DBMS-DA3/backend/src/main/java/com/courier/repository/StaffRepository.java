package com.courier.repository;

import com.courier.model.Staff;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends Neo4jRepository<Staff, String> {

    @Query("MATCH (s:Staff {staffId: $staffId}) RETURN s")
    Optional<Staff> findByStaffId(@Param("staffId") String staffId);

    @Query("MATCH (s:Staff) RETURN s ORDER BY s.staffId ASC")
    List<Staff> findAllStaff();

    @Query("MATCH (s:Staff) WHERE toLower(s.role) CONTAINS toLower($role) RETURN s ORDER BY s.name ASC")
    List<Staff> findByRole(@Param("role") String role);

    @Query("MERGE (s:Staff {staffId: $staffId}) " +
           "ON CREATE SET s.name = $name, s.role = $role, s.email = $email, s.branchId = $branchId, s.active = $active " +
           "ON MATCH SET s.name = $name, s.role = $role, s.email = $email, s.branchId = $branchId, s.active = $active " +
           "WITH s " +
           "OPTIONAL MATCH (s)-[r:WORKS_AT]->(:Branch) " +
           "DELETE r " +
           "WITH s " +
           "OPTIONAL MATCH (b:Branch {branchId: $branchId}) " +
           "FOREACH (_ IN CASE WHEN b IS NOT NULL THEN [1] ELSE [] END | MERGE (s)-[:WORKS_AT]->(b)) " +
           "RETURN s")
    Staff saveOrUpdateStaff(@Param("staffId") String staffId,
                            @Param("name") String name,
                            @Param("role") String role,
                            @Param("email") String email,
                            @Param("branchId") String branchId,
                            @Param("active") Boolean active);

    @Query("MATCH (s:Staff {staffId: $staffId}) DETACH DELETE s")
    void deleteStaffById(@Param("staffId") String staffId);
}
