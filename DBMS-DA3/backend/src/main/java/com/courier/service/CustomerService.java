package com.courier.service;

import com.courier.dto.*;
import com.courier.exception.DuplicateResourceException;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.Customer;
import com.courier.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ParcelRepository parcelRepository;
    private final PaymentRepository paymentRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public CustomerService(CustomerRepository customerRepository,
                           ParcelRepository parcelRepository,
                           PaymentRepository paymentRepository,
                           SupportTicketRepository supportTicketRepository,
                           TrackingEventRepository trackingEventRepository,
                           DeliveryAttemptRepository deliveryAttemptRepository) {
        this.customerRepository = customerRepository;
        this.parcelRepository = parcelRepository;
        this.paymentRepository = paymentRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    @Transactional
    public CustomerResponseDto registerCustomer(CustomerRequestDto request) {
        customerRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            throw new DuplicateResourceException("Customer with email '" + request.getEmail() + "' already exists");
        });

        customerRepository.findByPhone(request.getPhone()).ifPresent(existing -> {
            throw new DuplicateResourceException("Customer with phone '" + request.getPhone() + "' already exists");
        });

        String customerId = request.getCustomerId();
        if (customerId == null || customerId.isBlank()) {
            customerId = "C" + String.format("%03d", customerRepository.countAllCustomers() + 1);
            while (customerRepository.findByCustomerId(customerId).isPresent()) {
                customerId = "C" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
            }
        } else {
            if (customerRepository.findByCustomerId(customerId).isPresent()) {
                throw new DuplicateResourceException("Customer with ID '" + customerId + "' already exists");
            }
        }

        Customer saved = customerRepository.saveOrUpdateCustomer(
                customerId,
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress()
        );

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponseDto> listCustomers(int page, int size) {
        long skip = (long) page * size;
        List<Customer> customers = customerRepository.findAllPaged(skip, size);
        long total = customerRepository.countAllCustomers();

        List<CustomerResponseDto> dtoList = customers.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return new PageResponse<>(dtoList, page, size, total);
    }

    @Transactional(readOnly = true)
    public CustomerResponseDto getCustomerById(String customerId) {
        Customer customer = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));
        return mapToDto(customer);
    }

    @Transactional
    public CustomerResponseDto updateCustomer(String customerId, CustomerRequestDto request) {
        Customer existing = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        customerRepository.findByEmail(request.getEmail()).ifPresent(other -> {
            if (!other.getCustomerId().equals(customerId)) {
                throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already in use by another customer");
            }
        });

        customerRepository.findByPhone(request.getPhone()).ifPresent(other -> {
            if (!other.getCustomerId().equals(customerId)) {
                throw new DuplicateResourceException("Phone '" + request.getPhone() + "' is already in use by another customer");
            }
        });

        Customer updated = customerRepository.saveOrUpdateCustomer(
                customerId,
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress()
        );

        return mapToDto(updated);
    }

    @Transactional
    public void deleteCustomer(String customerId) {
        Customer customer = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        long parcelsCount = customerRepository.countParcelsBookedByCustomer(customerId);
        if (parcelsCount > 0) {
            throw new InvalidOperationException("Cannot delete customer '" + customerId + "' because they have " + parcelsCount + " booked parcel(s)");
        }

        long ticketsCount = customerRepository.countTicketsRaisedByCustomer(customerId);
        if (ticketsCount > 0) {
            throw new InvalidOperationException("Cannot delete customer '" + customerId + "' because they have " + ticketsCount + " active support ticket(s)");
        }

        customerRepository.deleteCustomerById(customerId);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponseDto> searchCustomers(String query) {
        if (query == null || query.isBlank()) {
            return listCustomers(0, 50).getContent();
        }
        return customerRepository.searchCustomers(query.trim()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ParcelResponseDto> getCustomerParcels(String customerId) {
        customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));
        List<ParcelResponseDto> parcels = parcelRepository.findParcelsByCustomerId(customerId).stream()
                .map(DtoMapper::mapToParcelResponse)
                .collect(Collectors.toList());
        DtoMapper.enrichParcels(parcels, trackingEventRepository, deliveryAttemptRepository);
        return parcels;
    }

    @Transactional(readOnly = true)
    public CustomerHistoryDto getCustomerHistory(String customerId) {
        Customer customer = customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        List<ParcelResponseDto> parcels = parcelRepository.findParcelsByCustomerId(customerId).stream()
                .map(DtoMapper::mapToParcelResponse)
                .collect(Collectors.toList());
        DtoMapper.enrichParcels(parcels, trackingEventRepository, deliveryAttemptRepository);

        List<PaymentResponseDto> payments = paymentRepository.findPaymentsByCustomer(customerId).stream()
                .map(DtoMapper::mapToPaymentResponse)
                .collect(Collectors.toList());

        List<SupportTicketDto> tickets = supportTicketRepository.findTicketsByCustomer(customerId).stream()
                .map(DtoMapper::mapToSupportTicketDto)
                .collect(Collectors.toList());

        return new CustomerHistoryDto(
                customer.getCustomerId(),
                customer.getName(),
                customer.getEmail(),
                parcels,
                payments,
                tickets
        );
    }

    private CustomerResponseDto mapToDto(Customer customer) {
        long parcelsCount = customerRepository.countParcelsBookedByCustomer(customer.getCustomerId());
        return new CustomerResponseDto(
                customer.getCustomerId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getAddress(),
                parcelsCount
        );
    }
}
