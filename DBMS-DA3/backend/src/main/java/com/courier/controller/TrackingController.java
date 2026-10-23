package com.courier.controller;

import com.courier.dto.TrackingEventRequest;
import com.courier.dto.TrackingEventResponseDto;
import com.courier.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping
    public ResponseEntity<TrackingEventResponseDto> addTrackingEvent(@Valid @RequestBody TrackingEventRequest request) {
        TrackingEventResponseDto created = trackingService.addTrackingEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{trackingNumber}")
    public ResponseEntity<TrackingEventResponseDto> addTrackingEventForParcel(
            @PathVariable String trackingNumber,
            @Valid @RequestBody TrackingEventRequest request) {
        request.setTrackingNumber(trackingNumber);
        TrackingEventResponseDto created = trackingService.addTrackingEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<TrackingEventResponseDto>> listTrackingEvents(
            @RequestParam(required = false) String trackingNumber) {
        if (trackingNumber != null && !trackingNumber.isBlank()) {
            return ResponseEntity.ok(trackingService.getTrackingHistory(trackingNumber));
        }
        return ResponseEntity.ok(trackingService.getRecentTrackingEvents(50));
    }

    @GetMapping("/{trackingNumber}")
    public ResponseEntity<List<TrackingEventResponseDto>> getTrackingHistory(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingService.getTrackingHistory(trackingNumber));
    }

    @GetMapping("/{trackingNumber}/current-status")
    public ResponseEntity<TrackingEventResponseDto> getCurrentStatus(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingService.getCurrentStatus(trackingNumber));
    }
}
