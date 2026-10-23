package com.courier.service;

import com.courier.dto.DashboardSummaryDto;
import com.courier.repository.DashboardRepository;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.PaymentRepository;
import com.courier.repository.TrackingEventRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private DashboardRepository dashboardRepository;

    @Mock
    private ParcelRepository parcelRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private TrackingEventRepository trackingEventRepository;

    @Mock
    private DeliveryAttemptRepository deliveryAttemptRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("Should compile complete dashboard summary with accurate calculations")
    void shouldGetDashboardSummary() {
        when(dashboardRepository.getTotalCustomers()).thenReturn(5L);
        when(dashboardRepository.getTotalParcels()).thenReturn(8L);

        Map<String, Long> statusMap = new HashMap<>();
        statusMap.put("DELIVERED", 2L);
        statusMap.put("IN_TRANSIT", 2L);
        statusMap.put("BOOKED", 3L);
        statusMap.put("OUT_FOR_DELIVERY", 1L);
        when(dashboardRepository.getParcelsByStatus()).thenReturn(statusMap);

        Map<String, Object> paymentSummary = new HashMap<>();
        paymentSummary.put("totalPaid", 850.0);
        paymentSummary.put("totalPending", 250.0);
        when(dashboardRepository.getPaymentSummary()).thenReturn(paymentSummary);

        Map<String, Long> outcomes = new HashMap<>();
        outcomes.put("SUCCESS", 2L);
        outcomes.put("CUSTOMER_UNAVAILABLE", 1L);
        when(dashboardRepository.getDeliveryOutcomeCounts()).thenReturn(outcomes);

        when(dashboardRepository.getServiceUsage()).thenReturn(Map.of("Standard Delivery", 3L));
        when(dashboardRepository.getBranchParcelCounts()).thenReturn(Collections.emptyMap());
        when(dashboardRepository.getAgentWorkload()).thenReturn(Map.of("Ravi", 1L));
        when(parcelRepository.findRecentBookings(5)).thenReturn(Collections.emptyList());
        when(trackingEventRepository.findRecentTrackingEvents(5)).thenReturn(Collections.emptyList());

        DashboardSummaryDto summary = dashboardService.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(5L, summary.getTotalCustomers());
        assertEquals(8L, summary.getTotalParcels());
        assertEquals(2L, summary.getDeliveredParcelsCount());
        assertEquals(6L, summary.getPendingParcelsCount()); // 8 total - 2 delivered = 6
        assertEquals(850.0, summary.getTotalCollectedRevenue());
        assertEquals(250.0, summary.getPendingPaymentTotal());
        assertEquals(2L, summary.getSuccessfulDeliveriesCount());
        assertEquals(1L, summary.getFailedDeliveriesCount());
    }

    @Test
    @DisplayName("Should enrich recent bookings with tracking events and delivery attempts")
    void shouldEnrichRecentBookingsWithTrackingEventsAndAttempts() {
        when(dashboardRepository.getTotalCustomers()).thenReturn(1L);
        when(dashboardRepository.getTotalParcels()).thenReturn(1L);
        when(dashboardRepository.getParcelsByStatus()).thenReturn(Collections.emptyMap());
        when(dashboardRepository.getPaymentSummary()).thenReturn(Collections.emptyMap());
        when(dashboardRepository.getDeliveryOutcomeCounts()).thenReturn(Collections.emptyMap());
        when(dashboardRepository.getServiceUsage()).thenReturn(Collections.emptyMap());
        when(dashboardRepository.getBranchParcelCounts()).thenReturn(Collections.emptyMap());
        when(dashboardRepository.getAgentWorkload()).thenReturn(Collections.emptyMap());
        when(trackingEventRepository.findRecentTrackingEvents(5)).thenReturn(Collections.emptyList());

        Map<String, Object> parcelMap = new HashMap<>();
        parcelMap.put("trackingNumber", "CR010");
        parcelMap.put("weight", 2.5);
        parcelMap.put("status", "IN_TRANSIT");
        parcelMap.put("customerId", "C001");
        parcelMap.put("customerName", "Alice");
        parcelMap.put("customerEmail", "customer@example.com");
        parcelMap.put("originBranchId", "B001");
        parcelMap.put("originCity", "Chennai");
        parcelMap.put("destBranchId", "B002");
        parcelMap.put("destCity", "Bangalore");
        parcelMap.put("serviceId", "S001");
        parcelMap.put("estimatedDays", 3);
        parcelMap.put("baseCharge", 150.0);

        when(parcelRepository.findRecentBookings(5)).thenReturn(List.of(parcelMap));

        Map<String, Object> eventMap = new HashMap<>();
        eventMap.put("eventId", "EV001");
        eventMap.put("trackingNumber", "CR010");
        eventMap.put("location", "Chennai Hub");
        eventMap.put("status", "IN_TRANSIT");

        when(trackingEventRepository.findEventsByParcelTrackingNumbers(List.of("CR010"))).thenReturn(List.of(eventMap));

        Map<String, Object> attemptMap = new HashMap<>();
        attemptMap.put("attemptId", "ATT001");
        attemptMap.put("trackingNumber", "CR010");
        attemptMap.put("attemptNumber", 1);
        attemptMap.put("result", "FAILED");

        when(deliveryAttemptRepository.findAttemptsByParcelTrackingNumbers(List.of("CR010"))).thenReturn(List.of(attemptMap));

        DashboardSummaryDto summary = dashboardService.getDashboardSummary();

        assertNotNull(summary);
        assertEquals(1, summary.getRecentBookings().size());
        var recent = summary.getRecentBookings().get(0);
        assertEquals("CR010", recent.getTrackingNumber());
        assertEquals("customer@example.com", recent.getCustomer().getEmail());
        assertEquals("Chennai", recent.getOriginBranch().getCity());
        assertEquals("Bangalore", recent.getDestinationBranch().getCity());
        assertEquals(3, recent.getCourierService().getEstimatedDays());
        assertEquals(150.0, recent.getCourierService().getBaseCharge());
        assertEquals(1, recent.getTrackingEvents().size());
        assertEquals("EV001", recent.getTrackingEvents().get(0).getEventId());
        assertEquals(1, recent.getDeliveryAttempts().size());
        assertEquals("ATT001", recent.getDeliveryAttempts().get(0).getAttemptId());
    }
}
