package com.courier.repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface DeliveryAttemptRepositoryCustom {

    List<Map<String, Object>> findAttemptsByParcel(String trackingNumber);

    List<Map<String, Object>> findAttemptsByParcelTrackingNumbers(Collection<String> trackingNumbers);

    List<Map<String, Object>> findAllAttempts();

    Map<String, Object> addAttemptToParcel(String trackingNumber,
                                          String attemptId,
                                          Integer attemptNumber,
                                          String result,
                                          String remarks,
                                          String timestamp);
}
