package com.courier.repository;

import com.courier.model.Branch;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends Neo4jRepository<Branch, String>, BranchRepositoryCustom {

    @Query("MATCH (b:Branch {branchId: $branchId}) RETURN b")
    Optional<Branch> findByBranchId(@Param("branchId") String branchId);

    @Query("MATCH (b:Branch) RETURN b ORDER BY b.branchId ASC")
    List<Branch> findAllBranches();

    @Query("MATCH (b:Branch) " +
           "WHERE toLower(b.name) CONTAINS toLower($query) " +
           "   OR toLower(b.city) CONTAINS toLower($query) " +
           "   OR b.branchId CONTAINS $query " +
           "RETURN b ORDER BY b.name ASC")
    List<Branch> searchBranches(@Param("query") String query);

    @Query("MATCH (b:Branch {branchId: $branchId})<-[:ORIGINATED_AT]-(p:Parcel) RETURN count(p)")
    long countOriginatingParcels(@Param("branchId") String branchId);

    @Query("MATCH (b:Branch {branchId: $branchId})<-[:DESTINED_FOR]-(p:Parcel) RETURN count(p)")
    long countDestinedParcels(@Param("branchId") String branchId);

    @Query("MERGE (b:Branch {branchId: $branchId}) " +
           "ON CREATE SET b.name = $name, b.city = $city " +
           "ON MATCH SET b.name = $name, b.city = $city " +
           "RETURN b")
    Branch saveOrUpdateBranch(@Param("branchId") String branchId,
                              @Param("name") String name,
                              @Param("city") String city);

    @Query("MATCH (b:Branch {branchId: $branchId}) DETACH DELETE b")
    void deleteBranchById(@Param("branchId") String branchId);
}
