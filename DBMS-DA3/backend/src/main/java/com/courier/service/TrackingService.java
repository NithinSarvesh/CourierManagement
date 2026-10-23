package com.courier.service;

import com.courier.dto.TrackingEventRequest;
import com.courier.dto.TrackingEventResponseDto;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Parcel;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.ParcelRepository;
import com.courier.repository.TrackingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TrackingService {

    private final TrackingEventRepository trackingEventRepository;
    private final ParcelRepository parcelRepository;

    public TrackingService(TrackingEventRepository trackingEventRepository, ParcelRepository parcelRepository) {
        this.trackingEventRepository = trackingEventRepository;
        this.parcelRepository = parcelRepository;
    }

    @Transactional
    public TrackingEventResponseDto addTrackingEvent(TrackingEventRequest request) {
        String trackingNumber = request.getTrackingNumber();
        Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        ParcelStatus targetStatus;
        try {
            targetStatus = ParcelStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid parcel status: " + request.getStatus());
        }

        ParcelStatus currentStatus;
        try {
            currentStatus = ParcelStatus.valueOf(parcel.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            currentStatus = ParcelStatus.BOOKED;
        }

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new InvalidOperationException(
                    "Invalid parcel status transition from '" + currentStatus + "' to '" + targetStatus + "'"
            );
        }

        // Prevent duplicate tracking events caused by accidental retries
        long duplicateCount = trackingEventRepository.countDuplicateEvents(trackingNumber, targetStatus.name(), request.getLocation());
        if (duplicateCount > 0) {
            throw new InvalidOperationException(
                    "Duplicate tracking event: A '" + targetStatus.name() + "' event at '" + request.getLocation() + "' already exists for parcel " + trackingNumber
            );
        }

        String eventId = "T" + String.format("%03d", trackingEventRepository.count() + 1);
        while (trackingEventRepository.findById(eventId).isPresent()) {
            eventId = "T" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        }

        ZonedDateTime timestamp = request.getTimestamp() != null ? request.getTimestamp() : ZonedDateTime.now();

        Map<String, Object> created = trackingEventRepository.addTrackingEventToParcel(
                trackingNumber,
                eventId,
                request.getLocation(),
                targetStatus.name(),
                timestamp.toString(),
                request.getRemarks()
        );

        return DtoMapper.mapToTrackingEventDto(created);
    }

    @Transactional(readOnly = true)
    public List<TrackingEventResponseDto> getTrackingHistory(String trackingNumber) {
        parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        return trackingEventRepository.findEventsByParcelOrdered(trackingNumber).stream()
                .map(DtoMapper::mapToTrackingEventDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TrackingEventResponseDto getCurrentStatus(String trackingNumber) {
        parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        return trackingEventRepository.findLatestEventByParcel(trackingNumber)
                .map(DtoMapper::mapToTrackingEventDto)
                .orElseThrow(() -> new ResourceNotFoundException("No tracking events recorded yet for parcel: " + trackingNumber));
    }

    @Transactional(readOnly = true)
    public List<TrackingEventResponseDto> getRecentTrackingEvents(int limit) {
        return trackingEventRepository.findRecentTrackingEvents(limit).stream()
                .map(DtoMapper::mapToTrackingEventDto)
                .collect(Collectors.toList());
    }
}
