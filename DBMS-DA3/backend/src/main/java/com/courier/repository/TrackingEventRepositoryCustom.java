package com.courier.repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface TrackingEventRepositoryCustom {

    List<Map<String, Object>> findEventsByParcelOrdered(String trackingNumber);

    List<Map<String, Object>> findEventsByParcelTrackingNumbers(Collection<String> trackingNumbers);

    Optional<Map<String, Object>> findLatestEventByParcel(String trackingNumber);

    Map<String, Object> addTrackingEventToParcel(String trackingNumber,
                                                String eventId,
                                                String location,
                                                String status,
                                                String timestamp,
                                                String remarks);

    List<Map<String, Object>> findRecentTrackingEvents(int limit);
}
