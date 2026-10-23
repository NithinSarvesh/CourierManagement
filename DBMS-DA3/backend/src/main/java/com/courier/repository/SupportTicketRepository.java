package com.courier.repository;

import com.courier.model.SupportTicket;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SupportTicketRepository extends Neo4jRepository<SupportTicket, String>, SupportTicketRepositoryCustom {

    @Query("MATCH (t:SupportTicket) " +
           "OPTIONAL MATCH (c:Customer)-[:RAISED]->(t) " +
           "WHERE ($status IS NULL OR t.status = $status) " +
           "  AND ($customerId IS NULL OR c.customerId = $customerId) " +
           "RETURN count(t)")
    long countTicketsWithFilter(@Param("status") String status, @Param("customerId") String customerId);

    @Query("MATCH (t:SupportTicket {ticketId: $ticketId}) " +
           "SET t.status = $status " +
           "SET t.priority = CASE WHEN $priority IS NOT NULL THEN $priority ELSE t.priority END " +
           "SET t.remarks = CASE WHEN $remarks IS NOT NULL THEN $remarks ELSE t.remarks END " +
           "RETURN t")
    SupportTicket updateTicketStatusAndRemarks(@Param("ticketId") String ticketId,
                                                @Param("status") String status,
                                                @Param("priority") String priority,
                                                @Param("remarks") String remarks);

    @Query("MATCH (t:SupportTicket {ticketId: $ticketId}), (s:Staff {staffId: $staffId}) " +
           "OPTIONAL MATCH (t)-[oldRel:ASSIGNED_TO]->(:Staff) " +
           "DELETE oldRel " +
           "MERGE (t)-[:ASSIGNED_TO]->(s) " +
           "RETURN t")
    SupportTicket assignTicketToStaff(@Param("ticketId") String ticketId, @Param("staffId") String staffId);
}
