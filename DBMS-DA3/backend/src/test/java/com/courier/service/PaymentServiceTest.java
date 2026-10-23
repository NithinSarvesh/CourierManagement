package com.courier.service;

import com.courier.dto.PaymentRequest;
import com.courier.dto.PaymentResponseDto;
import com.courier.dto.PaymentSummaryDto;
import com.courier.exception.InvalidOperationException;
import com.courier.model.Parcel;
import com.courier.repository.ParcelRepository;
import com.courier.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ParcelRepository parcelRepository;

    @Mock
    private com.courier.repository.DashboardRepository dashboardRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Parcel mockParcel;

    @BeforeEach
    void setUp() {
        mockParcel = new Parcel("CR001", 2.0, 200.0, "BOOKED");
    }

    @Test
    @DisplayName("Should successfully record payment for parcel")
    void shouldRecordPaymentSuccessfully() {
        PaymentRequest request = new PaymentRequest("CR001", 200.0, "UPI", "PAID");

        when(parcelRepository.findByTrackingNumber("CR001")).thenReturn(Optional.of(mockParcel));
        when(paymentRepository.findPaymentByParcel("CR001")).thenReturn(Optional.empty());
        when(paymentRepository.count()).thenReturn(8L);

        Map<String, Object> paymentMap = new HashMap<>();
        paymentMap.put("paymentId", "PAY009");
        paymentMap.put("trackingNumber", "CR001");
        paymentMap.put("amount", 200.0);
        paymentMap.put("method", "UPI");
        paymentMap.put("status", "PAID");

        when(paymentRepository.addPaymentToParcel(anyString(), anyString(), anyDouble(), anyString(), anyString(), anyString(), any()))
                .thenReturn(paymentMap);

        PaymentResponseDto response = paymentService.recordPayment(request);

        assertNotNull(response);
        assertEquals("PAY009", response.getPaymentId());
        assertEquals("PAID", response.getStatus());
        assertEquals(200.0, response.getAmount());
    }

    @Test
    @DisplayName("Should reject recording payment if parcel already has a PAID payment")
    void shouldPreventDuplicatePaidPayment() {
        PaymentRequest request = new PaymentRequest("CR001", 200.0, "CARD", "PAID");

        Map<String, Object> existingPayment = new HashMap<>();
        existingPayment.put("paymentId", "PAY001");
        existingPayment.put("status", "PAID");

        when(parcelRepository.findByTrackingNumber("CR001")).thenReturn(Optional.of(mockParcel));
        when(paymentRepository.findPaymentByParcel("CR001")).thenReturn(Optional.of(existingPayment));

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> paymentService.recordPayment(request));

        assertTrue(ex.getMessage().contains("already has a completed PAID payment"));
        verify(paymentRepository, never()).addPaymentToParcel(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should calculate total revenue and pending payment summary correctly")
    void shouldCalculatePaymentSummary() {
        Map<String, Object> mockSummary = new HashMap<>();
        mockSummary.put("totalPaid", 850.0);
        mockSummary.put("totalPending", 300.0);
        mockSummary.put("totalCount", 8L);
        mockSummary.put("paidCount", 6L);
        mockSummary.put("pendingCount", 2L);
        mockSummary.put("failedCount", 0L);

        when(dashboardRepository.getPaymentSummary()).thenReturn(mockSummary);

        PaymentSummaryDto summary = paymentService.getPaymentSummary();

        assertNotNull(summary);
        assertEquals(850.0, summary.getTotalCollectedRevenue());
        assertEquals(300.0, summary.getPendingPaymentAmount());
        assertEquals(6L, summary.getPaidCount());
        assertEquals(2L, summary.getPendingCount());
    }
}
