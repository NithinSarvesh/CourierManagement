package com.courier.service;

import com.courier.dto.ParcelBookingRequest;
import com.courier.dto.ParcelResponseDto;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Branch;
import com.courier.model.CourierService;
import com.courier.model.Customer;
import com.courier.model.Parcel;
import com.courier.model.enums.ParcelStatus;
import com.courier.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParcelServiceTest {

    @Mock
    private ParcelRepository parcelRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private CourierServiceRepository courierServiceRepository;

    @Mock
    private TrackingEventRepository trackingEventRepository;

    @Mock
    private DeliveryAttemptRepository deliveryAttemptRepository;

    @InjectMocks
    private ParcelService parcelService;

    private Customer mockCustomer;
    private Branch mockOrigin;
    private Branch mockDest;
    private CourierService mockService;

    @BeforeEach
    void setUp() {
        mockCustomer = new Customer("C001", "Arun Kumar", "arun@example.com", "9876543210", "Chennai");
        mockOrigin = new Branch("B001", "Chennai Central", "Chennai");
        mockDest = new Branch("B002", "Bengaluru Central", "Bengaluru");
        mockService = new CourierService("CS001", "Standard Delivery", 5, 100.0);
    }

    @Test
    @DisplayName("Should successfully book parcel and calculate delivery charge accurately")
    void shouldBookParcelWithCalculatedCharge() {
        ParcelBookingRequest request = new ParcelBookingRequest("C001", "B001", "B002", "CS001", 3.0);
        request.setTrackingNumber("CR100");

        when(customerRepository.findByCustomerId("C001")).thenReturn(Optional.of(mockCustomer));
        when(branchRepository.findByBranchId("B001")).thenReturn(Optional.of(mockOrigin));
        when(branchRepository.findByBranchId("B002")).thenReturn(Optional.of(mockDest));
        when(courierServiceRepository.findByServiceId("CS001")).thenReturn(Optional.of(mockService));
        when(parcelRepository.findByTrackingNumber("CR100")).thenReturn(Optional.empty());

        // Calculation: base charge 100 + (3.0 - 1.0) * 40 = 100 + 80 = 180.0
        Map<String, Object> mockDetails = new HashMap<>();
        mockDetails.put("trackingNumber", "CR100");
        mockDetails.put("weight", 3.0);
        mockDetails.put("deliveryCharge", 180.0);
        mockDetails.put("status", "BOOKED");
        mockDetails.put("customerId", "C001");
        mockDetails.put("customerName", "Arun Kumar");

        when(parcelRepository.findFullParcelDetails("CR100")).thenReturn(Optional.of(mockDetails));
        when(trackingEventRepository.findEventsByParcelOrdered("CR100")).thenReturn(Collections.emptyList());
        when(deliveryAttemptRepository.findAttemptsByParcel("CR100")).thenReturn(Collections.emptyList());

        ParcelResponseDto response = parcelService.bookParcel(request);

        assertNotNull(response);
        assertEquals("CR100", response.getTrackingNumber());
        assertEquals(180.0, response.getDeliveryCharge());
        verify(parcelRepository, times(1)).createParcelWithRelationships(
                eq("CR100"), eq(3.0), eq(180.0), eq("BOOKED"), eq("C001"), eq("B001"), eq("B002"), eq("CS001")
        );
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when customer does not exist during booking")
    void shouldThrowWhenCustomerNotFound() {
        ParcelBookingRequest request = new ParcelBookingRequest("UNKNOWN", "B001", "B002", "CS001", 2.0);
        when(customerRepository.findByCustomerId("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> parcelService.bookParcel(request));
        verify(parcelRepository, never()).createParcelWithRelationships(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when destination branch does not exist")
    void shouldThrowWhenBranchNotFound() {
        ParcelBookingRequest request = new ParcelBookingRequest("C001", "B001", "NON_EXISTENT", "CS001", 2.0);
        when(customerRepository.findByCustomerId("C001")).thenReturn(Optional.of(mockCustomer));
        when(branchRepository.findByBranchId("B001")).thenReturn(Optional.of(mockOrigin));
        when(branchRepository.findByBranchId("NON_EXISTENT")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> parcelService.bookParcel(request));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when courier service does not exist")
    void shouldThrowWhenServiceNotFound() {
        ParcelBookingRequest request = new ParcelBookingRequest("C001", "B001", "B002", "UNKNOWN_SRV", 2.0);
        when(customerRepository.findByCustomerId("C001")).thenReturn(Optional.of(mockCustomer));
        when(branchRepository.findByBranchId("B001")).thenReturn(Optional.of(mockOrigin));
        when(branchRepository.findByBranchId("B002")).thenReturn(Optional.of(mockDest));
        when(courierServiceRepository.findByServiceId("UNKNOWN_SRV")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> parcelService.bookParcel(request));
    }

    @Test
    @DisplayName("Should prevent cancelling a parcel that is already DELIVERED")
    void shouldPreventCancellingDeliveredParcel() {
        Parcel deliveredParcel = new Parcel("CR003", 2.0, 150.0, ParcelStatus.DELIVERED.name());
        when(parcelRepository.findByTrackingNumber("CR003")).thenReturn(Optional.of(deliveredParcel));

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> parcelService.cancelParcel("CR003", "Customer cancelled"));

        assertTrue(ex.getMessage().contains("Delivered parcels cannot be cancelled"));
        verify(parcelRepository, never()).updateParcelStatus(any(), any());
    }
}
