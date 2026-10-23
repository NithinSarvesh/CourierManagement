package com.courier.controller;

import com.courier.dto.CourierServiceDto;
import com.courier.service.CourierServiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class CourierServiceController {

    private final CourierServiceService courierServiceService;

    public CourierServiceController(CourierServiceService courierServiceService) {
        this.courierServiceService = courierServiceService;
    }

    @PostMapping
    public ResponseEntity<CourierServiceDto> createService(@Valid @RequestBody CourierServiceDto request) {
        CourierServiceDto created = courierServiceService.createService(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<CourierServiceDto>> listServices() {
        return ResponseEntity.ok(courierServiceService.getAllServices());
    }

    @GetMapping("/{serviceId}")
    public ResponseEntity<CourierServiceDto> getServiceById(@PathVariable String serviceId) {
        return ResponseEntity.ok(courierServiceService.getServiceById(serviceId));
    }

    @PutMapping("/{serviceId}")
    public ResponseEntity<CourierServiceDto> updateService(
            @PathVariable String serviceId,
            @Valid @RequestBody CourierServiceDto request) {
        return ResponseEntity.ok(courierServiceService.updateService(serviceId, request));
    }
}
