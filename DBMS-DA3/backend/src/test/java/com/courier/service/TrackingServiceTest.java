package com.courier.service;

import com.courier.dto.TrackingEventRequest;
import com.courier.dto.TrackingEventResponseDto;
import com.courier.exception.InvalidOperationException;
import com.courier.model.Parcel;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.ParcelRepository;
import com.courier.repository.TrackingEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackingServiceTest {

    @Mock
    private TrackingEventRepository trackingEventRepository;

    @Mock
    private ParcelRepository parcelRepository;

    @InjectMocks
    private TrackingService trackingService;

    private Parcel bookedParcel;

    @BeforeEach
    void setUp() {
        bookedParcel = new Parcel("CR001", 2.0, 200.0, ParcelStatus.BOOKED.name());
    }

    @Test
    @DisplayName("Should successfully add tracking event and advance parcel status")
    void shouldAddTrackingEventSuccessfully() {
        TrackingEventRequest request = new TrackingEventRequest("CR001", "Chennai Central", "PICKED_UP", "Picked up from customer");

        when(parcelRepository.findByTrackingNumber("CR001")).thenReturn(Optional.of(bookedParcel));
        when(trackingEventRepository.countDuplicateEvents("CR001", "PICKED_UP", "Chennai Central")).thenReturn(0L);
        when(trackingEventRepository.count()).thenReturn(10L);

        Map<String, Object> createdEvent = new HashMap<>();
        createdEvent.put("eventId", "T011");
        createdEvent.put("trackingNumber", "CR001");
        createdEvent.put("location", "Chennai Central");
        createdEvent.put("status", "PICKED_UP");
        createdEvent.put("timestamp", ZonedDateTime.now().toString());
        createdEvent.put("remarks", "Picked up from customer");

        when(trackingEventRepository.addTrackingEventToParcel(anyString(), anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(createdEvent);

        TrackingEventResponseDto response = trackingService.addTrackingEvent(request);

        assertNotNull(response);
        assertEquals("PICKED_UP", response.getStatus());
        assertEquals("Chennai Central", response.getLocation());
    }

    @Test
    @DisplayName("Should reject invalid parcel status transition (e.g., BOOKED directly to DELIVERED)")
    void shouldRejectInvalidStatusTransition() {
        TrackingEventRequest request = new TrackingEventRequest("CR001", "Customer Address", "DELIVERED", "Delivered");

        when(parcelRepository.findByTrackingNumber("CR001")).thenReturn(Optional.of(bookedParcel));

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> trackingService.addTrackingEvent(request));

        assertTrue(ex.getMessage().contains("Invalid parcel status transition"));
        verify(trackingEventRepository, never()).addTrackingEventToParcel(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should reject duplicate tracking event caused by repeated request")
    void shouldRejectDuplicateEvent() {
        TrackingEventRequest request = new TrackingEventRequest("CR001", "Chennai Central", "PICKED_UP", "Picked up");

        when(parcelRepository.findByTrackingNumber("CR001")).thenReturn(Optional.of(bookedParcel));
        when(trackingEventRepository.countDuplicateEvents("CR001", "PICKED_UP", "Chennai Central")).thenReturn(1L);

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> trackingService.addTrackingEvent(request));

        assertTrue(ex.getMessage().contains("Duplicate tracking event"));
    }

    @Test
    @DisplayName("Should retrieve tracking history in chronological order")
    void shouldRetrieveTrackingHistory() {
        Map<String, Object> event1 = new HashMap<>();
        event1.put("eventId", "T001");
        event1.put("location", "Chennai Central");
        event1.put("status", "BOOKED");
        event1.put("timestamp", "2025-10-09T08:53:20Z");

        Map<String, Object> event2 = new HashMap<>();
        event2.put("eventId", "T002");
        event2.put("location", "Chennai Central");
        event2.put("status", "IN_TRANSIT");
        event2.put("timestamp", "2025-10-09T10:00:00Z");

        when(parcelRepository.findByTrackingNumber("CR001")).thenReturn(Optional.of(bookedParcel));
        when(trackingEventRepository.findEventsByParcelOrdered("CR001")).thenReturn(List.of(event1, event2));

        List<TrackingEventResponseDto> history = trackingService.getTrackingHistory("CR001");

        assertNotNull(history);
        assertEquals(2, history.size());
        assertEquals("BOOKED", history.get(0).getStatus());
        assertEquals("IN_TRANSIT", history.get(1).getStatus());
    }
}
