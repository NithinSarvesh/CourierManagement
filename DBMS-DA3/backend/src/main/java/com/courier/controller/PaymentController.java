package com.courier.controller;

import com.courier.dto.PageResponse;
import com.courier.dto.PaymentRequest;
import com.courier.dto.PaymentResponseDto;
import com.courier.dto.PaymentSummaryDto;
import com.courier.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponseDto> recordPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentResponseDto created = paymentService.recordPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<PageResponse<PaymentResponseDto>> listPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String method,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(paymentService.listPayments(status, method, page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<PaymentSummaryDto> getPaymentSummary() {
        return ResponseEntity.ok(paymentService.getPaymentSummary());
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponseDto> getPaymentById(@PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/parcel/{trackingNumber}")
    public ResponseEntity<PaymentResponseDto> getPaymentByParcel(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(paymentService.getPaymentByParcel(trackingNumber));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PaymentResponseDto>> getPaymentsByCustomer(@PathVariable String customerId) {
        return ResponseEntity.ok(paymentService.getPaymentsByCustomerId(customerId));
    }
}
