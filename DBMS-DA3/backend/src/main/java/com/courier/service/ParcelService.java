package com.courier.service;

import com.courier.dto.*;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Branch;
import com.courier.model.CourierService;
import com.courier.model.Customer;
import com.courier.model.Parcel;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ParcelService {

    private final ParcelRepository parcelRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final CourierServiceRepository courierServiceRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public ParcelService(ParcelRepository parcelRepository,
                         PaymentRepository paymentRepository,
                         CustomerRepository customerRepository,
                         BranchRepository branchRepository,
                         CourierServiceRepository courierServiceRepository,
                         TrackingEventRepository trackingEventRepository,
                         DeliveryAttemptRepository deliveryAttemptRepository) {
        this.parcelRepository = parcelRepository;
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.branchRepository = branchRepository;
        this.courierServiceRepository = courierServiceRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    @Transactional
    public ParcelResponseDto bookParcel(ParcelBookingRequest request) {
        Customer customer = customerRepository.findByCustomerId(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));

        Branch originBranch = branchRepository.findByBranchId(request.getOriginBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Origin branch not found with ID: " + request.getOriginBranchId()));

        Branch destBranch = branchRepository.findByBranchId(request.getDestinationBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination branch not found with ID: " + request.getDestinationBranchId()));

        CourierService service = courierServiceRepository.findByServiceId(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Courier service not found with ID: " + request.getServiceId()));

        String trackingNumber = request.getTrackingNumber();
        if (trackingNumber == null || trackingNumber.isBlank()) {
            trackingNumber = "CR" + String.format("%03d", parcelRepository.count() + 1);
            while (parcelRepository.findByTrackingNumber(trackingNumber).isPresent()) {
                trackingNumber = "CR" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
            }
        } else {
            if (parcelRepository.findByTrackingNumber(trackingNumber).isPresent()) {
                throw new DuplicateResourceException("Parcel with tracking number '" + trackingNumber + "' already exists");
            }
        }

        // Delivery Charge Calculation:
        // Base rate comes from CourierService (e.g. 100 for Standard, 200 for Express, 350 for Same-Day)
        // Additional weight charge: for weight > 1.0kg, add 40 per additional kg
        double baseCharge = service.getBaseCharge() != null ? service.getBaseCharge() : 100.0;
        double weight = request.getWeight();
        double extraWeight = Math.max(0.0, weight - 1.0);
        double deliveryCharge = Math.round((baseCharge + (extraWeight * 40.0)) * 100.0) / 100.0;

        parcelRepository.createParcelWithRelationships(
                trackingNumber,
                weight,
                deliveryCharge,
                ParcelStatus.BOOKED.name(),
                request.getCustomerId(),
                request.getOriginBranchId(),
                request.getDestinationBranchId(),
                request.getServiceId()
        );

        // Initial tracking event
        String eventId = "T" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        trackingEventRepository.addTrackingEventToParcel(
                trackingNumber,
                eventId,
                originBranch.getName(),
                ParcelStatus.BOOKED.name(),
                ZonedDateTime.now().toString(),
                "Parcel booked at " + originBranch.getName() + " via " + service.getName()
        );

        return getParcelByTrackingNumber(trackingNumber);
    }

    @Transactional(readOnly = true)
    public ParcelResponseDto getParcelByTrackingNumber(String trackingNumber) {
        Map<String, Object> map = parcelRepository.findFullParcelDetails(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        ParcelResponseDto dto = DtoMapper.mapToParcelResponse(map);

        // Fetch ordered tracking history
        List<TrackingEventResponseDto> trackingEvents = trackingEventRepository.findEventsByParcelOrdered(trackingNumber).stream()
                .map(DtoMapper::mapToTrackingEventDto)
                .collect(Collectors.toList());
        dto.setTrackingEvents(trackingEvents);

        // Fetch delivery attempts
        List<DeliveryAttemptDto> attempts = deliveryAttemptRepository.findAttemptsByParcel(trackingNumber).stream()
                .map(DtoMapper::mapToDeliveryAttemptDto)
                .collect(Collectors.toList());
        dto.setDeliveryAttempts(attempts);

        return dto;
    }

    @Transactional(readOnly = true)
    public PageResponse<ParcelResponseDto> searchParcels(String status, String customerId, String branchId, String trackingNumber, int page, int size) {
        long skip = (long) page * size;
        String filterStatus = (status != null && !status.isBlank()) ? status.toUpperCase() : null;
        String filterCustomer = (customerId != null && !customerId.isBlank()) ? customerId : null;
        String filterBranch = (branchId != null && !branchId.isBlank()) ? branchId : null;
        String filterTrk = (trackingNumber != null && !trackingNumber.isBlank()) ? trackingNumber.trim() : null;

        List<ParcelResponseDto> list = parcelRepository.searchParcelsPaged(filterStatus, filterCustomer, filterBranch, filterTrk, skip, size).stream()
                .map(DtoMapper::mapToParcelResponse)
                .collect(Collectors.toList());

        DtoMapper.enrichParcels(list, trackingEventRepository, deliveryAttemptRepository);

        long total = parcelRepository.countParcelsWithFilter(filterStatus, filterCustomer, filterBranch, filterTrk);
        return new PageResponse<>(list, page, size, total);
    }

    @Transactional(readOnly = true)
    public List<ParcelResponseDto> getParcelsByCustomerId(String customerId) {
        List<ParcelResponseDto> list = parcelRepository.findParcelsByCustomerId(customerId).stream()
                .map(DtoMapper::mapToParcelResponse)
                .collect(Collectors.toList());
        DtoMapper.enrichParcels(list, trackingEventRepository, deliveryAttemptRepository);
        return list;
    }

    @Transactional
    public ParcelResponseDto updateParcel(String trackingNumber, ParcelUpdateRequest request) {
        Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        if (ParcelStatus.DELIVERED.name().equalsIgnoreCase(parcel.getStatus())) {
            throw new InvalidOperationException("Delivered parcels cannot be modified");
        }

        if (ParcelStatus.CANCELLED.name().equalsIgnoreCase(parcel.getStatus())) {
            throw new InvalidOperationException("Cancelled parcels cannot be modified");
        }

        Double newWeight = request.getWeight() != null ? request.getWeight() : parcel.getWeight();
        Double newCharge = parcel.getDeliveryCharge();

        if (request.getWeight() != null && !request.getWeight().equals(parcel.getWeight())) {
            // Recalculate charge based on existing parcel delivery charge delta
            double weightDiff = newWeight - parcel.getWeight();
            newCharge = Math.max(100.0, Math.round((parcel.getDeliveryCharge() + (weightDiff * 40.0)) * 100.0) / 100.0);
        }

            if (request.getWeight() != null
        && !request.getWeight().equals(parcel.getWeight())
        && Double.compare(newCharge, parcel.getDeliveryCharge()) != 0) {

    paymentRepository.findPaymentByParcel(trackingNumber).ifPresent(payment -> {
        Object paymentStatus = payment.get("status");

        if ("PAID".equalsIgnoreCase(String.valueOf(paymentStatus))) {
            throw new InvalidOperationException(
                "Cannot change delivery charge because this parcel already has a PAID payment"
            );
        }
    });
    
}

parcelRepository.updateParcelWeightAndCharge(trackingNumber, newWeight, newCharge);
        return getParcelByTrackingNumber(trackingNumber);
    }

    @Transactional
    public ParcelResponseDto cancelParcel(String trackingNumber, String reason) {
        Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        if (ParcelStatus.DELIVERED.name().equalsIgnoreCase(parcel.getStatus())) {
            throw new InvalidOperationException("Delivered parcels cannot be cancelled");
        }

        if (ParcelStatus.CANCELLED.name().equalsIgnoreCase(parcel.getStatus())) {
            throw new InvalidOperationException("Parcel is already cancelled");
        }

        parcelRepository.updateParcelStatus(trackingNumber, ParcelStatus.CANCELLED.name());

        String eventId = "T" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        trackingEventRepository.addTrackingEventToParcel(
                trackingNumber,
                eventId,
                "Origin / Central Hub",
                ParcelStatus.CANCELLED.name(),
                ZonedDateTime.now().toString(),
                reason != null && !reason.isBlank() ? reason : "Parcel booking cancelled by customer"
        );

        return getParcelByTrackingNumber(trackingNumber);
    }
}
