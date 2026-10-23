package com.courier.service;

import com.courier.dto.DeliveryAttemptDto;
import com.courier.dto.DeliveryAttemptRequest;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Parcel;
import com.courier.model.enums.DeliveryResult;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.TrackingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DeliveryAttemptService {

    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final ParcelRepository parcelRepository;
    private final TrackingEventRepository trackingEventRepository;

    public DeliveryAttemptService(DeliveryAttemptRepository deliveryAttemptRepository,
                                  ParcelRepository parcelRepository,
                                  TrackingEventRepository trackingEventRepository) {
        this.deliveryAttemptRepository = deliveryAttemptRepository;
        this.parcelRepository = parcelRepository;
        this.trackingEventRepository = trackingEventRepository;
    }

    @Transactional
    public DeliveryAttemptDto recordAttempt(DeliveryAttemptRequest request) {
        String trackingNumber = request.getTrackingNumber();
        Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        if (ParcelStatus.DELIVERED.name().equalsIgnoreCase(parcel.getStatus())) {
            throw new InvalidOperationException("Parcel is already delivered; no further delivery attempts allowed.");
        }

        if (ParcelStatus.CANCELLED.name().equalsIgnoreCase(parcel.getStatus())) {
            throw new InvalidOperationException("Parcel is cancelled; cannot make delivery attempt.");
        }

        try {
            DeliveryResult.valueOf(request.getResult().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid delivery result: " + request.getResult() +
                    ". Allowed values: SUCCESS, CUSTOMER_UNAVAILABLE, ADDRESS_NOT_FOUND, REJECTED, RESCHEDULED, FAILED");
        }

        String attemptId = "DA" + String.format("%03d", deliveryAttemptRepository.count() + 1);
        while (deliveryAttemptRepository.findById(attemptId).isPresent()) {
            attemptId = "DA" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        }

        String timestamp = Instant.now().toString();

        Map<String, Object> created = deliveryAttemptRepository.addAttemptToParcel(
                trackingNumber,
                attemptId,
                request.getAttemptNumber(),
                request.getResult().toUpperCase(),
                request.getRemarks(),
                timestamp
        );

        // Synchronize parcel status & tracking
        if (DeliveryResult.SUCCESS.name().equalsIgnoreCase(request.getResult())) {
            parcelRepository.updateParcelStatus(trackingNumber, ParcelStatus.DELIVERED.name());
            String eventId = "T" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            trackingEventRepository.addTrackingEventToParcel(
                    trackingNumber,
                    eventId,
                    "Destination Address",
                    ParcelStatus.DELIVERED.name(),
                    ZonedDateTime.now().toString(),
                    "Delivery attempt successful. Parcel delivered."
            );
        } else if (request.getAttemptNumber() >= 3) {
            parcelRepository.updateParcelStatus(trackingNumber, ParcelStatus.DELIVERY_FAILED.name());
            String eventId = "T" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            trackingEventRepository.addTrackingEventToParcel(
                    trackingNumber,
                    eventId,
                    "Destination Delivery Station",
                    ParcelStatus.DELIVERY_FAILED.name(),
                    ZonedDateTime.now().toString(),
                    "Max delivery attempts exceeded: " + request.getResult()
            );
        }

        return DtoMapper.mapToDeliveryAttemptDto(created);
    }

    @Transactional(readOnly = true)
    public List<DeliveryAttemptDto> getAttemptsByParcel(String trackingNumber) {
        parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        return deliveryAttemptRepository.findAttemptsByParcel(trackingNumber).stream()
                .map(DtoMapper::mapToDeliveryAttemptDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeliveryAttemptDto> getAllAttempts() {
        return deliveryAttemptRepository.findAllAttempts().stream()
                .map(DtoMapper::mapToDeliveryAttemptDto)
                .collect(Collectors.toList());
    }
}
