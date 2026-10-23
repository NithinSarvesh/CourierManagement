package com.courier.service;

import com.courier.dto.CustomerRequestDto;
import com.courier.dto.CustomerResponseDto;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Customer;
import com.courier.repository.CustomerRepository;
import com.courier.repository.DeliveryAttemptRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.PaymentRepository;
import com.courier.repository.SupportTicketRepository;
import com.courier.repository.TrackingEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ParcelRepository parcelRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private SupportTicketRepository supportTicketRepository;

    @Mock
    private TrackingEventRepository trackingEventRepository;

    @Mock
    private DeliveryAttemptRepository deliveryAttemptRepository;

    @InjectMocks
    private CustomerService customerService;

    private Customer testCustomer;
    private CustomerRequestDto testRequest;

    @BeforeEach
    void setUp() {
        testCustomer = new Customer("C001", "Arun Kumar", "arun@example.com", "9876543210", "Anna Nagar, Chennai");
        testRequest = new CustomerRequestDto("C001", "Arun Kumar", "arun@example.com", "9876543210", "Anna Nagar, Chennai");
    }

    @Test
    @DisplayName("Should successfully register a new customer")
    void shouldRegisterNewCustomer() {
        when(customerRepository.findByEmail(testRequest.getEmail())).thenReturn(Optional.empty());
        when(customerRepository.findByPhone(testRequest.getPhone())).thenReturn(Optional.empty());
        when(customerRepository.findByCustomerId(testRequest.getCustomerId())).thenReturn(Optional.empty());
        when(customerRepository.saveOrUpdateCustomer(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(testCustomer);
        when(customerRepository.countParcelsBookedByCustomer("C001")).thenReturn(0L);

        CustomerResponseDto response = customerService.registerCustomer(testRequest);

        assertNotNull(response);
        assertEquals("C001", response.getCustomerId());
        assertEquals("Arun Kumar", response.getName());
        verify(customerRepository, times(1)).saveOrUpdateCustomer(eq("C001"), eq("Arun Kumar"), eq("arun@example.com"), eq("9876543210"), eq("Anna Nagar, Chennai"));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when customer email already exists")
    void shouldThrowWhenEmailDuplicate() {
        when(customerRepository.findByEmail(testRequest.getEmail())).thenReturn(Optional.of(testCustomer));

        assertThrows(DuplicateResourceException.class, () -> customerService.registerCustomer(testRequest));
        verify(customerRepository, never()).saveOrUpdateCustomer(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when customer phone already exists")
    void shouldThrowWhenPhoneDuplicate() {
        when(customerRepository.findByEmail(testRequest.getEmail())).thenReturn(Optional.empty());
        when(customerRepository.findByPhone(testRequest.getPhone())).thenReturn(Optional.of(testCustomer));

        assertThrows(DuplicateResourceException.class, () -> customerService.registerCustomer(testRequest));
        verify(customerRepository, never()).saveOrUpdateCustomer(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should retrieve customer by customerId")
    void shouldGetCustomerById() {
        when(customerRepository.findByCustomerId("C001")).thenReturn(Optional.of(testCustomer));
        when(customerRepository.countParcelsBookedByCustomer("C001")).thenReturn(3L);

        CustomerResponseDto response = customerService.getCustomerById("C001");

        assertNotNull(response);
        assertEquals("C001", response.getCustomerId());
        assertEquals(3L, response.getTotalParcelsBooked());
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when customer not found")
    void shouldThrowWhenCustomerNotFound() {
        when(customerRepository.findByCustomerId("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> customerService.getCustomerById("UNKNOWN"));
    }

    @Test
    @DisplayName("Should reject customer deletion when customer has booked parcels")
    void shouldPreventCustomerDeletionWithActiveParcels() {
        when(customerRepository.findByCustomerId("C001")).thenReturn(Optional.of(testCustomer));
        when(customerRepository.countParcelsBookedByCustomer("C001")).thenReturn(2L);

        InvalidOperationException ex = assertThrows(InvalidOperationException.class,
                () -> customerService.deleteCustomer("C001"));

        assertTrue(ex.getMessage().contains("booked parcel(s)"));
        verify(customerRepository, never()).deleteCustomerById(anyString());
    }
}
