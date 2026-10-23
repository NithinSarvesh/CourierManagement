package com.courier.service;

import com.courier.dto.VehicleDto;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.DeliveryAgent;
import com.courier.model.Vehicle;
import com.courier.model.enums.VehicleType;
import com.courier.repository.DeliveryAgentRepository;
import com.courier.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.courier.repository.VehicleDetailsProjection;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DeliveryAgentRepository deliveryAgentRepository;

    public VehicleService(VehicleRepository vehicleRepository, DeliveryAgentRepository deliveryAgentRepository) {
        this.vehicleRepository = vehicleRepository;
        this.deliveryAgentRepository = deliveryAgentRepository;
    }

    @Transactional
    public VehicleDto registerVehicle(VehicleDto request) {
        String vehicleId = request.getVehicleId();
        if (vehicleId == null || vehicleId.isBlank()) {
            vehicleId = "V" + String.format("%03d", vehicleRepository.count() + 1);
            while (vehicleRepository.findByVehicleId(vehicleId).isPresent()) {
                vehicleId = "V" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            }
        } else {
            if (vehicleRepository.findByVehicleId(vehicleId).isPresent()) {
                throw new DuplicateResourceException("Vehicle with ID '" + vehicleId + "' already exists");
            }
        }

        try {
            VehicleType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid vehicle type: " + request.getType() + ". Allowed: VAN, TRUCK, BIKE");
        }

        Vehicle saved = vehicleRepository.saveOrUpdateVehicle(
                vehicleId,
                request.getType().toUpperCase(),
                request.getRegistration(),
                request.getCapacityKg(),
                request.getStatus() != null ? request.getStatus().toUpperCase() : "AVAILABLE"
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<VehicleDto> getAllVehicles() {
        return vehicleRepository.findAllVehiclesWithAgent().stream()
                .map(this::mapRowToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleDto getVehicleById(String vehicleId) {
        return vehicleRepository.findVehicleDetails(vehicleId)
                .map(this::mapRowToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));
    }

    @Transactional
    public VehicleDto updateVehicle(String vehicleId, VehicleDto request) {
        Vehicle vehicle = vehicleRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        if (request.getType() != null) {
            try {
                VehicleType.valueOf(request.getType().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new InvalidOperationException("Invalid vehicle type: " + request.getType() + ". Allowed: VAN, TRUCK, BIKE");
            }
        }

        Vehicle updated = vehicleRepository.saveOrUpdateVehicle(
                vehicleId,
                request.getType() != null ? request.getType().toUpperCase() : vehicle.getType(),
                request.getRegistration() != null ? request.getRegistration() : vehicle.getRegistration(),
                request.getCapacityKg() != null ? request.getCapacityKg() : vehicle.getCapacityKg(),
                request.getStatus() != null ? request.getStatus().toUpperCase() : (vehicle.getStatus() != null ? vehicle.getStatus() : "AVAILABLE")
        );

        return getVehicleById(vehicleId);
    }

    @Transactional
    public VehicleDto assignVehicleToAgent(String vehicleId, String agentId) {
        vehicleRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        DeliveryAgent agent = deliveryAgentRepository.findByAgentId(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery agent not found with ID: " + agentId));

        vehicleRepository.assignVehicleToAgent(vehicleId, agentId);
        return getVehicleById(vehicleId);
    }

    @Transactional
    public VehicleDto unassignVehicle(String vehicleId) {
        vehicleRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with ID: " + vehicleId));

        vehicleRepository.unassignVehicle(vehicleId);
        return getVehicleById(vehicleId);
    }

    private VehicleDto mapToDto(Vehicle v) {
        return new VehicleDto(v.getVehicleId(), v.getType(), v.getRegistration(), v.getCapacityKg(), v.getStatus(), null, null);
    }

    private VehicleDto mapRowToDto(VehicleDetailsProjection row) {
    VehicleDto dto = new VehicleDto();
    dto.setVehicleId(row.getVehicleId());
    dto.setType(row.getType());
    dto.setRegistration(row.getRegistration());
    dto.setCapacityKg(row.getCapacityKg());
    dto.setStatus(row.getStatus());
    dto.setAssignedAgentId(row.getAssignedAgentId());
    dto.setAssignedAgentName(row.getAssignedAgentName());
    return dto;
}
}
