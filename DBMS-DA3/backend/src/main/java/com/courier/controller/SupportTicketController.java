package com.courier.controller;

import com.courier.dto.PageResponse;
import com.courier.dto.SupportTicketDto;
import com.courier.dto.SupportTicketRequest;
import com.courier.dto.TicketStatusUpdateRequest;
import com.courier.service.SupportTicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support-tickets")
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    public SupportTicketController(SupportTicketService supportTicketService) {
        this.supportTicketService = supportTicketService;
    }

    @PostMapping
    public ResponseEntity<SupportTicketDto> createTicket(@Valid @RequestBody SupportTicketRequest request) {
        SupportTicketDto created = supportTicketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<PageResponse<SupportTicketDto>> listTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(supportTicketService.listTickets(status, customerId, page, size));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<SupportTicketDto> getTicketById(@PathVariable String ticketId) {
        return ResponseEntity.ok(supportTicketService.getTicketById(ticketId));
    }

    @PutMapping("/{ticketId}/status")
    public ResponseEntity<SupportTicketDto> updateTicketStatus(
            @PathVariable String ticketId,
            @Valid @RequestBody TicketStatusUpdateRequest request) {
        return ResponseEntity.ok(supportTicketService.updateTicketStatus(ticketId, request));
    }

    @PostMapping("/{ticketId}/assign/{staffId}")
    public ResponseEntity<SupportTicketDto> assignTicketToStaff(
            @PathVariable String ticketId,
            @PathVariable String staffId) {
        return ResponseEntity.ok(supportTicketService.assignTicketToStaff(ticketId, staffId));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SupportTicketDto>> getTicketsByCustomerId(@PathVariable String customerId) {
        return ResponseEntity.ok(supportTicketService.getTicketsByCustomerId(customerId));
    }
}
