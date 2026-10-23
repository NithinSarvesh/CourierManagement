package com.courier.service;

import com.courier.dto.AgentDeliveriesDto;
import com.courier.dto.DeliveryAgentDto;
import com.courier.dto.ParcelResponseDto;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.DeliveryAgent;
import com.courier.model.Parcel;
import com.courier.model.enums.AgentStatus;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.DeliveryAgentRepository;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.TrackingEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DeliveryAgentService {

    private final DeliveryAgentRepository deliveryAgentRepository;
    private final ParcelRepository parcelRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public DeliveryAgentService(DeliveryAgentRepository deliveryAgentRepository,
                                ParcelRepository parcelRepository,
                                TrackingEventRepository trackingEventRepository,
                                DeliveryAttemptRepository deliveryAttemptRepository) {
        this.deliveryAgentRepository = deliveryAgentRepository;
        this.parcelRepository = parcelRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    @Transactional
    public DeliveryAgentDto registerAgent(DeliveryAgentDto request) {
        String agentId = request.getAgentId();
        if (agentId == null || agentId.isBlank()) {
            agentId = "A" + String.format("%03d", deliveryAgentRepository.count() + 1);
            while (deliveryAgentRepository.findByAgentId(agentId).isPresent()) {
                agentId = "A" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            }
        } else {
            if (deliveryAgentRepository.findByAgentId(agentId).isPresent()) {
                throw new DuplicateResourceException("Delivery agent with ID '" + agentId + "' already exists");
            }
        }

        String initialStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : AgentStatus.AVAILABLE.name();
        DeliveryAgent saved = deliveryAgentRepository.saveOrUpdateAgent(
                agentId,
                request.getName(),
                request.getPhone(),
                initialStatus
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<DeliveryAgentDto> getAllAgents() {
        return deliveryAgentRepository.findAllAgents().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeliveryAgentDto> getAvailableAgents() {
        return deliveryAgentRepository.findAvailableAgents().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeliveryAgentDto getAgentById(String agentId) {
        DeliveryAgent agent = deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));
        return mapToDto(agent);
    }

    @Transactional
    public DeliveryAgentDto updateAgent(String agentId, DeliveryAgentDto request) {
        DeliveryAgent agent = deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));

        DeliveryAgent updated = deliveryAgentRepository.saveOrUpdateAgent(
                agentId,
                request.getName() != null ? request.getName() : agent.getName(),
                request.getPhone() != null ? request.getPhone() : agent.getPhone(),
                request.getStatus() != null ? request.getStatus().toUpperCase() : agent.getStatus()
        );

        return mapToDto(updated);
    }

    @Transactional
    public DeliveryAgentDto updateAgentStatus(String agentId, String status) {
        DeliveryAgent agent = deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));

        try {
            AgentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid agent status: " + status + ". Allowed values: AVAILABLE, ON_DELIVERY, INACTIVE");
        }

        DeliveryAgent updated = deliveryAgentRepository.updateAgentStatus(agentId, status.toUpperCase());
        return mapToDto(updated);
    }

    @Transactional
    public ParcelResponseDto assignAgentToParcel(String agentId, String trackingNumber) {
        DeliveryAgent agent = deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));

        if (AgentStatus.INACTIVE.name().equalsIgnoreCase(agent.getStatus())) {
            throw new InvalidOperationException("Cannot assign parcel to inactive agent: " + agentId);
        }

        Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        if (ParcelStatus.DELIVERED.name().equalsIgnoreCase(parcel.getStatus()) ||
            ParcelStatus.CANCELLED.name().equalsIgnoreCase(parcel.getStatus())) {
            throw new InvalidOperationException("Cannot assign agent to a parcel that is already " + parcel.getStatus());
        }

        parcelRepository.assignAgentToParcel(trackingNumber, agentId);

        // Update status to OUT_FOR_DELIVERY if it was IN_TRANSIT or BOOKED
        if (!ParcelStatus.OUT_FOR_DELIVERY.name().equalsIgnoreCase(parcel.getStatus())) {
            parcelRepository.updateParcelStatus(trackingNumber, ParcelStatus.OUT_FOR_DELIVERY.name());
        }

        return parcelRepository.findFullParcelDetails(trackingNumber)
                .map(DtoMapper::mapToParcelResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Error retrieving updated parcel"));
    }

    @Transactional
    public ParcelResponseDto reassignAgentToParcel(String newAgentId, String trackingNumber) {
        return assignAgentToParcel(newAgentId, trackingNumber);
    }

    @Transactional
    public ParcelResponseDto completeAssignment(String agentId, String trackingNumber) {
        DeliveryAgent agent = deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));

        Parcel parcel = parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        parcelRepository.unassignAgent(trackingNumber);

        long activeDeliveries = deliveryAgentRepository.countActiveDeliveries(agentId);
        if (activeDeliveries == 0) {
            deliveryAgentRepository.updateAgentStatus(agentId, AgentStatus.AVAILABLE.name());
        }

        return parcelRepository.findFullParcelDetails(trackingNumber)
                .map(DtoMapper::mapToParcelResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Error retrieving updated parcel"));
    }

    @Transactional(readOnly = true)
    public List<ParcelResponseDto> getParcelsByAgent(String agentId) {
        deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));

        List<ParcelResponseDto> parcels = parcelRepository.findParcelsByAgentId(agentId).stream()
                .map(DtoMapper::mapToParcelResponse)
                .collect(Collectors.toList());
        DtoMapper.enrichParcels(parcels, trackingEventRepository, deliveryAttemptRepository);
        return parcels;
    }

    @Transactional(readOnly = true)
    public AgentDeliveriesDto getAgentDeliveries(String agentId) {
        DeliveryAgent agent = deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));

        List<ParcelResponseDto> all = getParcelsByAgent(agentId);
        List<ParcelResponseDto> pending = new ArrayList<>();
        List<ParcelResponseDto> completed = new ArrayList<>();

        for (ParcelResponseDto p : all) {
            if (ParcelStatus.DELIVERED.name().equalsIgnoreCase(p.getStatus())) {
                completed.add(p);
            } else {
                pending.add(p);
            }
        }

        return new AgentDeliveriesDto(
                agent.getAgentId(),
                agent.getName(),
                agent.getStatus(),
                pending,
                completed
        );
    }

    private DeliveryAgentDto mapToDto(DeliveryAgent agent) {
        long activeCount = deliveryAgentRepository.countActiveDeliveries(agent.getAgentId());
        DeliveryAgentDto dto = new DeliveryAgentDto(agent.getAgentId(), agent.getName(), agent.getPhone(), agent.getStatus());
        dto.setActiveDeliveriesCount(activeCount);

        deliveryAgentRepository.findAssignedVehicle(agent.getAgentId()).ifPresent(veh -> {
            dto.setAssignedVehicleId((String) veh.get("vehicleId"));
            dto.setAssignedVehicleRegistration((String) veh.get("registration"));
        });

        return dto;
    }
}
