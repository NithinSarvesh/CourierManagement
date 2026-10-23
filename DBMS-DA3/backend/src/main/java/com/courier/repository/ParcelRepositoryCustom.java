package com.courier.repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ParcelRepositoryCustom {

    Optional<Map<String, Object>> findFullParcelDetails(String trackingNumber);

    List<Map<String, Object>> searchParcelsPaged(String status,
                                                String customerId,
                                                String branchId,
                                                String trackingNumber,
                                                long skip,
                                                int limit);

    List<Map<String, Object>> findParcelsByCustomerId(String customerId);

    List<Map<String, Object>> findParcelsByBranch(String branchId, String type);

    List<Map<String, Object>> findParcelsByAgentId(String agentId);

    List<Map<String, Object>> getServiceUsageStatistics();

    List<Map<String, Object>> getParcelStatusCounts();

    List<Map<String, Object>> findRecentBookings(int limit);
}
