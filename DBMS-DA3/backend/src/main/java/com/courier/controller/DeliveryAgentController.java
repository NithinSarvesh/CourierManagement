package com.courier.controller;

import com.courier.dto.AgentDeliveriesDto;
import com.courier.dto.DeliveryAgentDto;
import com.courier.dto.ParcelResponseDto;
import com.courier.service.DeliveryAgentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
public class DeliveryAgentController {

    private final DeliveryAgentService deliveryAgentService;

    public DeliveryAgentController(DeliveryAgentService deliveryAgentService) {
        this.deliveryAgentService = deliveryAgentService;
    }

    @PostMapping
    public ResponseEntity<DeliveryAgentDto> registerAgent(@Valid @RequestBody DeliveryAgentDto request) {
        DeliveryAgentDto created = deliveryAgentService.registerAgent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<DeliveryAgentDto>> listAgents() {
        return ResponseEntity.ok(deliveryAgentService.getAllAgents());
    }

    @GetMapping("/available")
    public ResponseEntity<List<DeliveryAgentDto>> getAvailableAgents() {
        return ResponseEntity.ok(deliveryAgentService.getAvailableAgents());
    }

    @GetMapping("/{agentId}")
    public ResponseEntity<DeliveryAgentDto> getAgentById(@PathVariable String agentId) {
        return ResponseEntity.ok(deliveryAgentService.getAgentById(agentId));
    }

    @PutMapping("/{agentId}")
    public ResponseEntity<DeliveryAgentDto> updateAgent(
            @PathVariable String agentId,
            @Valid @RequestBody DeliveryAgentDto request) {
        return ResponseEntity.ok(deliveryAgentService.updateAgent(agentId, request));
    }

    @PatchMapping("/{agentId}/status")
    public ResponseEntity<DeliveryAgentDto> updateAgentStatus(
            @PathVariable String agentId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(deliveryAgentService.updateAgentStatus(agentId, status));
    }

    @PostMapping("/{agentId}/assign/{trackingNumber}")
    public ResponseEntity<ParcelResponseDto> assignAgentToParcel(
            @PathVariable String agentId,
            @PathVariable String trackingNumber) {
        return ResponseEntity.ok(deliveryAgentService.assignAgentToParcel(agentId, trackingNumber));
    }

    @PostMapping("/{agentId}/reassign/{trackingNumber}")
    public ResponseEntity<ParcelResponseDto> reassignAgentToParcel(
            @PathVariable String agentId,
            @PathVariable String trackingNumber) {
        return ResponseEntity.ok(deliveryAgentService.reassignAgentToParcel(agentId, trackingNumber));
    }

    @PostMapping("/{agentId}/complete/{trackingNumber}")
    public ResponseEntity<ParcelResponseDto> completeAssignment(
            @PathVariable String agentId,
            @PathVariable String trackingNumber) {
        return ResponseEntity.ok(deliveryAgentService.completeAssignment(agentId, trackingNumber));
    }

    @GetMapping("/{agentId}/parcels")
    public ResponseEntity<List<ParcelResponseDto>> getParcelsByAgent(@PathVariable String agentId) {
        return ResponseEntity.ok(deliveryAgentService.getParcelsByAgent(agentId));
    }

    @GetMapping("/{agentId}/deliveries")
    public ResponseEntity<AgentDeliveriesDto> getAgentDeliveries(@PathVariable String agentId) {
        return ResponseEntity.ok(deliveryAgentService.getAgentDeliveries(agentId));
    }
}
