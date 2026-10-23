package com.courier.repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface SupportTicketRepositoryCustom {

    Optional<Map<String, Object>> findTicketDetailsById(String ticketId);

    List<Map<String, Object>> findTicketsByCustomer(String customerId);

    List<Map<String, Object>> findTicketsByParcel(String trackingNumber);

    List<Map<String, Object>> findAllTicketsPaged(String status, String customerId, long skip, int limit);

    Map<String, Object> createTicketWithCustomerAndParcel(String ticketId,
                                                          String customerId,
                                                          String trackingNumber,
                                                          String subject,
                                                          String status,
                                                          String priority,
                                                          String remarks,
                                                          String createdAt);
}
