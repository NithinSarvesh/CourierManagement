package com.courier.service;

import com.courier.dto.PageResponse;
import com.courier.dto.SupportTicketDto;
import com.courier.dto.SupportTicketRequest;
import com.courier.dto.TicketStatusUpdateRequest;
import com.courier.exception.InvalidOperationException;
import com.courier.exception.ResourceNotFoundException;
import com.courier.model.enums.TicketPriority;
import com.courier.model.enums.TicketStatus;
import com.courier.repository.CustomerRepository;
import com.courier.repository.ParcelRepository;
import com.courier.repository.StaffRepository;
import com.courier.repository.SupportTicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final CustomerRepository customerRepository;
    private final ParcelRepository parcelRepository;
    private final StaffRepository staffRepository;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                CustomerRepository customerRepository,
                                ParcelRepository parcelRepository,
                                StaffRepository staffRepository) {
        this.supportTicketRepository = supportTicketRepository;
        this.customerRepository = customerRepository;
        this.parcelRepository = parcelRepository;
        this.staffRepository = staffRepository;
    }

    @Transactional
    public SupportTicketDto createTicket(SupportTicketRequest request) {
        customerRepository.findByCustomerId(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));

        if (request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()) {
            parcelRepository.findByTrackingNumber(request.getTrackingNumber())
                    .orElseThrow(() -> new ResourceNotFoundException("Parcel not found with tracking number: " + request.getTrackingNumber()));
        }

        String priority = request.getPriority() != null ? request.getPriority().toUpperCase() : TicketPriority.MEDIUM.name();
        try {
            TicketPriority.valueOf(priority);
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid ticket priority: " + request.getPriority() + ". Allowed: LOW, MEDIUM, HIGH, URGENT");
        }

        String ticketId = "TK" + String.format("%03d", supportTicketRepository.count() + 1);
        while (supportTicketRepository.findById(ticketId).isPresent()) {
            ticketId = "TK" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        }

        String remarks = (request.getRemarks() != null && !request.getRemarks().isBlank())
                ? request.getRemarks()
                : "Support ticket registered";

        String createdAt = ZonedDateTime.now().toString();

        Map<String, Object> created = supportTicketRepository.createTicketWithCustomerAndParcel(
                ticketId,
                request.getCustomerId(),
                request.getTrackingNumber(),
                request.getSubject(),
                TicketStatus.OPEN.name(),
                priority,
                remarks,
                createdAt
        );

        return DtoMapper.mapToSupportTicketDto(created);
    }

    @Transactional(readOnly = true)
    public SupportTicketDto getTicketById(String ticketId) {
        return supportTicketRepository.findTicketDetailsById(ticketId)
                .map(DtoMapper::mapToSupportTicketDto)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found with ID: " + ticketId));
    }

    @Transactional(readOnly = true)
    public PageResponse<SupportTicketDto> listTickets(String status, String customerId, int page, int size) {
        long skip = (long) page * size;
        String filterStatus = (status != null && !status.isBlank()) ? status.toUpperCase() : null;
        String filterCustomer = (customerId != null && !customerId.isBlank()) ? customerId : null;

        List<SupportTicketDto> list = supportTicketRepository.findAllTicketsPaged(filterStatus, filterCustomer, skip, size).stream()
                .map(DtoMapper::mapToSupportTicketDto)
                .collect(Collectors.toList());

        long total = supportTicketRepository.countTicketsWithFilter(filterStatus, filterCustomer);
        return new PageResponse<>(list, page, size, total);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketDto> getTicketsByCustomerId(String customerId) {
        customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + customerId));

        return supportTicketRepository.findTicketsByCustomer(customerId).stream()
                .map(DtoMapper::mapToSupportTicketDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupportTicketDto assignTicketToStaff(String ticketId, String staffId) {
        supportTicketRepository.findTicketDetailsById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found with ID: " + ticketId));

        staffRepository.findByStaffId(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found with ID: " + staffId));

        supportTicketRepository.assignTicketToStaff(ticketId, staffId);
        supportTicketRepository.updateTicketStatusAndRemarks(ticketId, TicketStatus.IN_PROGRESS.name(), null, null);

        return getTicketById(ticketId);
    }

    @Transactional
    public SupportTicketDto updateTicketStatus(String ticketId, TicketStatusUpdateRequest request) {
        supportTicketRepository.findTicketDetailsById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found with ID: " + ticketId));

        String status = request.getStatus().toUpperCase();
        try {
            TicketStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new InvalidOperationException("Invalid ticket status: " + request.getStatus() + ". Allowed: OPEN, IN_PROGRESS, RESOLVED, CLOSED");
        }

        String priority = null;
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            priority = request.getPriority().toUpperCase();
            try {
                TicketPriority.valueOf(priority);
            } catch (IllegalArgumentException e) {
                throw new InvalidOperationException("Invalid ticket priority: " + request.getPriority() + ". Allowed: LOW, MEDIUM, HIGH, URGENT");
            }
        }

        supportTicketRepository.updateTicketStatusAndRemarks(ticketId, status, priority, request.getRemarks());
        return getTicketById(ticketId);
    }
}
