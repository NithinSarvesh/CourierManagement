package com.courier.controller;

import com.courier.dto.PageResponse;
import com.courier.dto.ParcelBookingRequest;
import com.courier.dto.ParcelResponseDto;
import com.courier.dto.ParcelUpdateRequest;
import com.courier.service.ParcelService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/parcels")
public class ParcelController {

    private final ParcelService parcelService;

    public ParcelController(ParcelService parcelService) {
        this.parcelService = parcelService;
    }

    @PostMapping
    public ResponseEntity<ParcelResponseDto> bookParcel(@Valid @RequestBody ParcelBookingRequest request) {
        ParcelResponseDto created = parcelService.bookParcel(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<PageResponse<ParcelResponseDto>> listParcels(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) String trackingNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(parcelService.searchParcels(status, customerId, branchId, trackingNumber, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<ParcelResponseDto>> searchParcels(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String branchId,
            @RequestParam(required = false) String trackingNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(parcelService.searchParcels(status, customerId, branchId, trackingNumber, page, size));
    }

    @GetMapping("/{trackingNumber}")
    public ResponseEntity<ParcelResponseDto> getParcelByTrackingNumber(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(parcelService.getParcelByTrackingNumber(trackingNumber));
    }

    @PutMapping("/{trackingNumber}")
    public ResponseEntity<ParcelResponseDto> updateParcel(
            @PathVariable String trackingNumber,
            @Valid @RequestBody ParcelUpdateRequest request) {
        return ResponseEntity.ok(parcelService.updateParcel(trackingNumber, request));
    }

    @PostMapping("/{trackingNumber}/cancel")
    public ResponseEntity<ParcelResponseDto> cancelParcel(
            @PathVariable String trackingNumber,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(parcelService.cancelParcel(trackingNumber, reason));
    }

    @PatchMapping("/{trackingNumber}/cancel")
    public ResponseEntity<ParcelResponseDto> cancelParcelPatch(
            @PathVariable String trackingNumber,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(parcelService.cancelParcel(trackingNumber, reason));
    }
}
