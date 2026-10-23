package com.courier.service;

import com.courier.dto.PageResponse;
import com.courier.dto.PaymentRequest;
import com.courier.dto.PaymentResponseDto;
import com.courier.dto.PaymentSummaryDto;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Parcel;
import com.courier.model.enums.PaymentMethod;
import com.courier.model.enums.PaymentStatus;
import com.courier.repository.DashboardRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ParcelRepository parcelRepository;
    private final DashboardRepository dashboardRepository;

    public PaymentService(PaymentRepository paymentRepository, ParcelRepository parcelRepository, DashboardRepository dashboardRepository) {
        this.paymentRepository = paymentRepository;
        this.parcelRepository = parcelRepository;
        this.dashboardRepository = dashboardRepository;
    }

    @Transactional
    public PaymentResponseDto recordPayment(PaymentRequest request) {
        Parcel parcel = parcelRepository.findByTrackingNumber(request.getTrackingNumber())
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + request.getTrackingNumber()));

        // Prevent duplicate paid records
        paymentRepository.findPaymentByParcel(request.getTrackingNumber()).ifPresent(existingPayment -> {
            String status = (String) existingPayment.get("status");
            if (PaymentStatus.PAID.name().equalsIgnoreCase(status)) {
                throw new InvalidOperationException("Parcel '" + request.getTrackingNumber() + "' already has a completed PAID payment (ID: " + existingPayment.get("paymentId") + ")");
            }
        });
        if (parcel.getDeliveryCharge() != null
        && Math.abs(request.getAmount() - parcel.getDeliveryCharge()) > 0.009) {
    throw new InvalidOperationException(
            "Payment amount must match the parcel delivery charge of Rs. "
                    + parcel.getDeliveryCharge()
    );
}

        try {
            PaymentMethod.valueOf(request.getMethod().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid payment method: " + request.getMethod() + ". Allowed: CASH, CARD, UPI");
        }

        String paymentStatus = request.getStatus() != null ? request.getStatus().toUpperCase() : PaymentStatus.PAID.name();
        try {
            PaymentStatus.valueOf(paymentStatus);
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid payment status: " + request.getStatus() + ". Allowed: PENDING, PAID, FAILED");
        }

        String paymentId = "PAY" + String.format("%03d", paymentRepository.count() + 1);
        while (paymentRepository.findPaymentDetailsById(paymentId).isPresent()) {
            paymentId = "PAY" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        }

        String transactionRef = request.getTransactionRef() != null ? request.getTransactionRef() : "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String paymentDate = ZonedDateTime.now().toString();

        Map<String, Object> created = paymentRepository.addPaymentToParcel(
                request.getTrackingNumber(),
                paymentId,
                request.getAmount(),
                request.getMethod().toUpperCase(),
                paymentStatus,
                paymentDate,
                transactionRef
        );

        return DtoMapper.mapToPaymentResponse(created);
    }

    @Transactional(readOnly = true)
    public PaymentResponseDto getPaymentById(String paymentId) {
        return paymentRepository.findPaymentDetailsById(paymentId)
                .map(DtoMapper::mapToPaymentResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));
    }

    @Transactional(readOnly = true)
    public PaymentResponseDto getPaymentByParcel(String trackingNumber) {
        parcelRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + trackingNumber));

        return paymentRepository.findPaymentByParcel(trackingNumber)
                .map(DtoMapper::mapToPaymentResponse)
                .orElseThrow(() -> new ResourceNotFoundException("No payment record found for parcel: " + trackingNumber));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponseDto> getPaymentsByCustomerId(String customerId) {
        return paymentRepository.findPaymentsByCustomer(customerId).stream()
                .map(DtoMapper::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponseDto> listPayments(String status, String method, int page, int size) {
        long skip = (long) page * size;
        String filterStatus = (status != null && !status.isBlank()) ? status.toUpperCase() : null;
        String filterMethod = (method != null && !method.isBlank()) ? method.toUpperCase() : null;

        List<PaymentResponseDto> list = paymentRepository.findAllPaymentsPaged(filterStatus, filterMethod, skip, size).stream()
                .map(DtoMapper::mapToPaymentResponse)
                .collect(Collectors.toList());

        long total = paymentRepository.countPaymentsWithFilter(filterStatus, filterMethod);
        return new PageResponse<>(list, page, size, total);
    }

    @Transactional(readOnly = true)
    public PaymentSummaryDto getPaymentSummary() {
        Map<String, Object> summary = dashboardRepository.getPaymentSummary();
        Double totalPaid = summary.get("totalPaid") != null ? ((Number) summary.get("totalPaid")).doubleValue() : 0.0;
        Double totalPending = summary.get("totalPending") != null ? ((Number) summary.get("totalPending")).doubleValue() : 0.0;
        long totalTransactions = summary.get("totalCount") != null ? ((Number) summary.get("totalCount")).longValue() : 0L;
        long paidCount = summary.get("paidCount") != null ? ((Number) summary.get("paidCount")).longValue() : 0L;
        long pendingCount = summary.get("pendingCount") != null ? ((Number) summary.get("pendingCount")).longValue() : 0L;
        long failedCount = summary.get("failedCount") != null ? ((Number) summary.get("failedCount")).longValue() : 0L;

        return new PaymentSummaryDto(totalPaid, totalPending, totalTransactions, paidCount, pendingCount, failedCount);
    }
}
