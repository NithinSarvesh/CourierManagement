package com.courier.controller;

import com.courier.dto.CustomerRequestDto;
import com.courier.dto.CustomerResponseDto;
import com.courier.dto.PageResponse;
import com.courier.exception.GlobalExceptionHandler;
import com.courier.exception.ResourceNotFoundException;
import com.courier.service.CustomerService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CustomerService customerService;

    @InjectMocks
    private CustomerController customerController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(customerController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("POST /api/customers - Should create customer and return 201 Created")
    void shouldRegisterCustomer() throws Exception {
        CustomerRequestDto request = new CustomerRequestDto("C001", "Arun Kumar", "arun@example.com", "9876543210", "Chennai");
        CustomerResponseDto response = new CustomerResponseDto("C001", "Arun Kumar", "arun@example.com", "9876543210", "Chennai", 0L);

        when(customerService.registerCustomer(any(CustomerRequestDto.class))).thenReturn(response);

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerId").value("C001"))
                .andExpect(jsonPath("$.name").value("Arun Kumar"))
                .andExpect(jsonPath("$.email").value("arun@example.com"));
    }

    @Test
    @DisplayName("GET /api/customers/{customerId} - Should return customer details")
    void shouldGetCustomerById() throws Exception {
        CustomerResponseDto response = new CustomerResponseDto("C001", "Arun Kumar", "arun@example.com", "9876543210", "Chennai", 2L);
        when(customerService.getCustomerById("C001")).thenReturn(response);

        mockMvc.perform(get("/api/customers/C001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.customerId").value("C001"))
                .andExpect(jsonPath("$.totalParcelsBooked").value(2));
    }

    @Test
    @DisplayName("GET /api/customers/{customerId} - Should return 404 when not found")
    void shouldReturn404WhenCustomerNotFound() throws Exception {
        when(customerService.getCustomerById("UNKNOWN"))
                .thenThrow(new ResourceNotFoundException("Customer not found with ID: UNKNOWN"));

        mockMvc.perform(get("/api/customers/UNKNOWN"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Customer not found with ID: UNKNOWN"));
    }

    @Test
    @DisplayName("GET /api/customers - Should return paginated list")
    void shouldListCustomersPaged() throws Exception {
        CustomerResponseDto c1 = new CustomerResponseDto("C001", "Arun Kumar", "arun@example.com", "9876543210", "Chennai", 2L);
        PageResponse<CustomerResponseDto> pageResponse = new PageResponse<>(List.of(c1), 0, 10, 1L);

        when(customerService.listCustomers(0, 10)).thenReturn(pageResponse);

        mockMvc.perform(get("/api/customers?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].customerId").value("C001"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }
}
