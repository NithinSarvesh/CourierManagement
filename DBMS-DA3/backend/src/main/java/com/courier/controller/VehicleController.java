package com.courier.controller;

import com.courier.dto.VehicleDto;
import com.courier.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<VehicleDto> registerVehicle(@Valid @RequestBody VehicleDto request) {
        VehicleDto created = vehicleService.registerVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<VehicleDto>> listVehicles() {
        return ResponseEntity.ok(vehicleService.getAllVehicles());
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<VehicleDto> getVehicleById(@PathVariable String vehicleId) {
        return ResponseEntity.ok(vehicleService.getVehicleById(vehicleId));
    }

    @PutMapping("/{vehicleId}")
    public ResponseEntity<VehicleDto> updateVehicle(
            @PathVariable String vehicleId,
            @Valid @RequestBody VehicleDto request) {
        return ResponseEntity.ok(vehicleService.updateVehicle(vehicleId, request));
    }

    @PostMapping("/{vehicleId}/assign-agent/{agentId}")
    public ResponseEntity<VehicleDto> assignVehicleToAgent(
            @PathVariable String vehicleId,
            @PathVariable String agentId) {
        return ResponseEntity.ok(vehicleService.assignVehicleToAgent(vehicleId, agentId));
    }

    @PostMapping("/{vehicleId}/unassign")
    public ResponseEntity<VehicleDto> unassignVehicle(@PathVariable String vehicleId) {
        return ResponseEntity.ok(vehicleService.unassignVehicle(vehicleId));
    }
}
