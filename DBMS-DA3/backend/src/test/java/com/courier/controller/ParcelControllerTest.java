package com.courier.controller;

import com.courier.dto.ParcelBookingRequest;
import com.courier.dto.ParcelResponseDto;
import com.courier.exception.GlobalExceptionHandler;
import com.courier.exception.ResourceNotFoundException;
import com.courier.service.ParcelService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ParcelControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ParcelService parcelService;

    @InjectMocks
    private ParcelController parcelController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(parcelController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/parcels - Should book parcel and return 201 Created")
    void shouldBookParcel() throws Exception {
        ParcelBookingRequest request = new ParcelBookingRequest("C001", "B001", "B002", "CS001", 2.5);
        ParcelResponseDto response = new ParcelResponseDto("CR001", 2.5, 200.0, "BOOKED");

        when(parcelService.bookParcel(any(ParcelBookingRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/parcels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trackingNumber").value("CR001"))
                .andExpect(jsonPath("$.deliveryCharge").value(200.0))
                .andExpect(jsonPath("$.status").value("BOOKED"));
    }

    @Test
    @DisplayName("GET /api/parcels/{trackingNumber} - Should return parcel details")
    void shouldGetParcelByTrackingNumber() throws Exception {
        ParcelResponseDto response = new ParcelResponseDto("CR001", 2.5, 200.0, "IN_TRANSIT");
        when(parcelService.getParcelByTrackingNumber("CR001")).thenReturn(response);

        mockMvc.perform(get("/api/parcels/CR001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingNumber").value("CR001"))
                .andExpect(jsonPath("$.status").value("IN_TRANSIT"));
    }

    @Test
    @DisplayName("GET /api/parcels/{trackingNumber} - Should return 404 when parcel not found")
    void shouldReturn404WhenParcelNotFound() throws Exception {
        when(parcelService.getParcelByTrackingNumber("INVALID"))
                .thenThrow(new ResourceNotFoundException("Parcel not found with tracking number: INVALID"));

        mockMvc.perform(get("/api/parcels/INVALID"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Parcel not found with tracking number: INVALID"));
    }
}
