package com.courier.service;

import com.courier.dto.CourierServiceDto;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.CourierService;
import com.courier.repository.CourierServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CourierServiceService {

    private final CourierServiceRepository courierServiceRepository;

    public CourierServiceService(CourierServiceRepository courierServiceRepository) {
        this.courierServiceRepository = courierServiceRepository;
    }

    @Transactional
    public CourierServiceDto createService(CourierServiceDto request) {
        String serviceId = request.getServiceId();
        if (serviceId == null || serviceId.isBlank()) {
            serviceId = "CS" + String.format("%03d", courierServiceRepository.count() + 1);
            while (courierServiceRepository.findByServiceId(serviceId).isPresent()) {
                serviceId = "CS" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            }
        } else {
            if (courierServiceRepository.findByServiceId(serviceId).isPresent()) {
                throw new DuplicateResourceException("Courier service with ID '" + serviceId + "' already exists");
            }
        }

        CourierService saved = courierServiceRepository.saveOrUpdateService(
                serviceId,
                request.getName(),
                request.getEstimatedDays(),
                request.getBaseCharge(),
                request.getDescription(),
                request.getActive() != null ? request.getActive() : true
        );
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<CourierServiceDto> getAllServices() {
        return courierServiceRepository.findAllServices().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourierServiceDto getServiceById(String serviceId) {
        CourierService service = courierServiceRepository.findByServiceId(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Courier service not found with ID: " + serviceId));
        return mapToDto(service);
    }

    @Transactional
    public CourierServiceDto updateService(String serviceId, CourierServiceDto request) {
        CourierService existing = courierServiceRepository.findByServiceId(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Courier service not found with ID: " + serviceId));

        CourierService updated = courierServiceRepository.saveOrUpdateService(
                serviceId,
                request.getName() != null ? request.getName() : existing.getName(),
                request.getEstimatedDays() != null ? request.getEstimatedDays() : existing.getEstimatedDays(),
                request.getBaseCharge() != null ? request.getBaseCharge() : existing.getBaseCharge(),
                request.getDescription() != null ? request.getDescription() : existing.getDescription(),
                request.getActive() != null ? request.getActive() : (existing.getActive() != null ? existing.getActive() : true)
        );
        return mapToDto(updated);
    }

    private CourierServiceDto mapToDto(CourierService service) {
        return new CourierServiceDto(
                service.getServiceId(),
                service.getName(),
                service.getEstimatedDays(),
                service.getBaseCharge(),
                service.getDescription(),
                service.getActive()
        );
    }
}
