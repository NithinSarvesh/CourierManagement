package com.courier.controller;

import com.courier.dto.CustomerHistoryDto;
import com.courier.dto.CustomerRequestDto;
import com.courier.dto.CustomerResponseDto;
import com.courier.dto.PageResponse;
import com.courier.dto.ParcelResponseDto;
import com.courier.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    public ResponseEntity<CustomerResponseDto> registerCustomer(@Valid @RequestBody CustomerRequestDto request) {
        CustomerResponseDto created = customerService.registerCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<PageResponse<CustomerResponseDto>> listCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(customerService.listCustomers(page, size));
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<CustomerResponseDto> getCustomerById(@PathVariable String customerId) {
        return ResponseEntity.ok(customerService.getCustomerById(customerId));
    }

    @PutMapping("/{customerId}")
    public ResponseEntity<CustomerResponseDto> updateCustomer(
            @PathVariable String customerId,
            @Valid @RequestBody CustomerRequestDto request) {
        return ResponseEntity.ok(customerService.updateCustomer(customerId, request));
    }

    @DeleteMapping("/{customerId}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable String customerId) {
        customerService.deleteCustomer(customerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<CustomerResponseDto>> searchCustomers(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(customerService.searchCustomers(query));
    }

    @GetMapping("/{customerId}/parcels")
    public ResponseEntity<List<ParcelResponseDto>> getCustomerParcels(@PathVariable String customerId) {
        return ResponseEntity.ok(customerService.getCustomerParcels(customerId));
    }

    @GetMapping("/{customerId}/history")
    public ResponseEntity<CustomerHistoryDto> getCustomerHistory(@PathVariable String customerId) {
        return ResponseEntity.ok(customerService.getCustomerHistory(customerId));
    }
}
