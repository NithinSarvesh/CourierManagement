package com.courier.controller;

import com.courier.dto.DeliveryAttemptDto;
import com.courier.dto.DeliveryAttemptRequest;
import com.courier.service.DeliveryAttemptService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-attempts")
public class DeliveryAttemptController {

    private final DeliveryAttemptService deliveryAttemptService;

    public DeliveryAttemptController(DeliveryAttemptService deliveryAttemptService) {
        this.deliveryAttemptService = deliveryAttemptService;
    }

    @PostMapping
    public ResponseEntity<DeliveryAttemptDto> recordAttempt(@Valid @RequestBody DeliveryAttemptRequest request) {
        DeliveryAttemptDto created = deliveryAttemptService.recordAttempt(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<DeliveryAttemptDto>> listAttempts(@RequestParam(required = false) String trackingNumber) {
        if (trackingNumber != null && !trackingNumber.isBlank()) {
            return ResponseEntity.ok(deliveryAttemptService.getAttemptsByParcel(trackingNumber));
        }
        return ResponseEntity.ok(deliveryAttemptService.getAllAttempts());
    }

    @GetMapping("/parcel/{trackingNumber}")
    public ResponseEntity<List<DeliveryAttemptDto>> getAttemptsByParcel(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(deliveryAttemptService.getAttemptsByParcel(trackingNumber));
    }
}
