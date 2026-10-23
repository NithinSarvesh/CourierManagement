package com.courier.service;

import com.courier.dto.DashboardSummaryDto;
import com.courier.dto.DeliveryAttemptDto;
import com.courier.dto.ParcelResponseDto;
import com.courier.dto.TrackingEventResponseDto;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.DashboardRepository;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.PaymentRepository;
import com.courier.repository.TrackingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final DashboardRepository dashboardRepository;
    private final ParcelRepository parcelRepository;
    private final PaymentRepository paymentRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public DashboardService(DashboardRepository dashboardRepository,
                            ParcelRepository parcelRepository,
                            PaymentRepository paymentRepository,
                            TrackingEventRepository trackingEventRepository,
                            DeliveryAttemptRepository deliveryAttemptRepository) {
        this.dashboardRepository = dashboardRepository;
        this.parcelRepository = parcelRepository;
        this.paymentRepository = paymentRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary() {
        DashboardSummaryDto dto = new DashboardSummaryDto();

        dto.setTotalCustomers(dashboardRepository.getTotalCustomers());
        dto.setTotalParcels(dashboardRepository.getTotalParcels());

        Map<String, Long> statusMap = dashboardRepository.getParcelsByStatus();
        dto.setParcelsByStatus(statusMap);

        long delivered = statusMap.getOrDefault(ParcelStatus.DELIVERED.name(), 0L);
        dto.setDeliveredParcelsCount(delivered);
        long pending = dto.getTotalParcels() - delivered - statusMap.getOrDefault(ParcelStatus.CANCELLED.name(), 0L);
        dto.setPendingParcelsCount(Math.max(0L, pending));

        Map<String, Object> paymentSummary = dashboardRepository.getPaymentSummary();
        dto.setTotalCollectedRevenue(paymentSummary.get("totalPaid") != null ? ((Number) paymentSummary.get("totalPaid")).doubleValue() : 0.0);
        dto.setPendingPaymentTotal(paymentSummary.get("totalPending") != null ? ((Number) paymentSummary.get("totalPending")).doubleValue() : 0.0);

        Map<String, Long> outcomes = dashboardRepository.getDeliveryOutcomeCounts();
        dto.setSuccessfulDeliveriesCount(outcomes.getOrDefault("SUCCESS", 0L));
        long failed = outcomes.entrySet().stream()
                .filter(e -> !"SUCCESS".equalsIgnoreCase(e.getKey()))
                .mapToLong(Map.Entry::getValue)
                .sum();
        dto.setFailedDeliveriesCount(failed);

        dto.setCourierServiceUsage(dashboardRepository.getServiceUsage());
        dto.setBranchParcelCounts(dashboardRepository.getBranchParcelCounts());
        dto.setAgentWorkload(dashboardRepository.getAgentWorkload());

        List<ParcelResponseDto> recentBookings = parcelRepository.findRecentBookings(5).stream()
                .map(DtoMapper::mapToParcelResponse)
                .collect(Collectors.toList());

        DtoMapper.enrichParcels(recentBookings, trackingEventRepository, deliveryAttemptRepository);

        dto.setRecentBookings(recentBookings);

        List<TrackingEventResponseDto> recentTracking = trackingEventRepository.findRecentTrackingEvents(5).stream()
                .map(DtoMapper::mapToTrackingEventDto)
                .collect(Collectors.toList());
        dto.setRecentTrackingEvents(recentTracking);

        return dto;
    }
}
