package com.courier.service;

import com.courier.dto.DeliveryAttemptDto;
import com.courier.dto.DeliveryAttemptRequest;
import com.courier.exception.InvalidOperationException;
import com.courier.model.Parcel;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.TrackingEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryAttemptServiceTest {

    @Mock
    private DeliveryAttemptRepository deliveryAttemptRepository;

    @Mock
    private ParcelRepository parcelRepository;

    @Mock
    private TrackingEventRepository trackingEventRepository;

    @InjectMocks
    private DeliveryAttemptService deliveryAttemptService;

    private Parcel inTransitParcel;

    @BeforeEach
    void setUp() {
        inTransitParcel = new Parcel("CR004", 4.0, 200.0, "OUT_FOR_DELIVERY");
    }

    @Test
    @DisplayName("Should successfully record successful attempt and advance parcel to DELIVERED")
    void shouldRecordSuccessAttempt() {
        DeliveryAttemptRequest request = new DeliveryAttemptRequest("CR004", 1, "SUCCESS", "Delivered to recipient");

        when(parcelRepository.findByTrackingNumber("CR004")).thenReturn(Optional.of(inTransitParcel));
        when(deliveryAttemptRepository.count()).thenReturn(3L);

        Map<String, Object> attemptMap = new HashMap<>();
        attemptMap.put("attemptId", "DA004");
        attemptMap.put("trackingNumber", "CR004");
        attemptMap.put("attemptNumber", 1);
        attemptMap.put("result", "SUCCESS");
        attemptMap.put("remarks", "Delivered to recipient");
        attemptMap.put("timestamp", Instant.now().toString());

        when(deliveryAttemptRepository.addAttemptToParcel(anyString(), anyString(), anyInt(), anyString(), anyString(), anyString()))
                .thenReturn(attemptMap);

        DeliveryAttemptDto response = deliveryAttemptService.recordAttempt(request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getResult());
        verify(parcelRepository, times(1)).updateParcelStatus("CR004", ParcelStatus.DELIVERED.name());
        verify(trackingEventRepository, times(1)).addTrackingEventToParcel(eq("CR004"), anyString(), eq("Destination Address"), eq(ParcelStatus.DELIVERED.name()), anyString(), anyString());
    }

    @Test
    @DisplayName("Should set status to DELIVERY_FAILED when attempt number reaches 3")
    void shouldSetDeliveryFailedWhenAttemptsExceeded() {
        DeliveryAttemptRequest request = new DeliveryAttemptRequest("CR004", 3, "CUSTOMER_UNAVAILABLE", "Recipient not available 3rd time");

        when(parcelRepository.findByTrackingNumber("CR004")).thenReturn(Optional.of(inTransitParcel));
        when(deliveryAttemptRepository.count()).thenReturn(3L);

        Map<String, Object> attemptMap = new HashMap<>();
        attemptMap.put("attemptId", "DA005");
        attemptMap.put("trackingNumber", "CR004");
        attemptMap.put("attemptNumber", 3);
        attemptMap.put("result", "CUSTOMER_UNAVAILABLE");
        attemptMap.put("remarks", "Recipient not available 3rd time");
        attemptMap.put("timestamp", Instant.now().toString());

        when(deliveryAttemptRepository.addAttemptToParcel(anyString(), anyString(), anyInt(), anyString(), anyString(), anyString()))
                .thenReturn(attemptMap);

        DeliveryAttemptDto response = deliveryAttemptService.recordAttempt(request);

        assertNotNull(response);
        assertEquals("CUSTOMER_UNAVAILABLE", response.getResult());
        verify(parcelRepository, times(1)).updateParcelStatus("CR004", ParcelStatus.DELIVERY_FAILED.name());
    }

    @Test
    @DisplayName("Should prevent recording delivery attempt on already delivered parcel")
    void shouldPreventAttemptOnDeliveredParcel() {
        Parcel deliveredParcel = new Parcel("CR003", 0.8, 350.0, ParcelStatus.DELIVERED.name());
        when(parcelRepository.findByTrackingNumber("CR003")).thenReturn(Optional.of(deliveredParcel));

        DeliveryAttemptRequest request = new DeliveryAttemptRequest("CR003", 2, "SUCCESS", "Repeat");

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> deliveryAttemptService.recordAttempt(request));

        assertTrue(ex.getMessage().contains("already delivered"));
        verify(deliveryAttemptRepository, never()).addAttemptToParcel(any(), any(), any(), any(), any(), any());
    }
}
