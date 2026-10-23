package com.courier.dto;

import java.util.List;

public class CustomerHistoryDto {

    private String customerId;
    private String name;
    private String email;
    private List<ParcelResponseDto> parcels;
    private List<PaymentResponseDto> payments;
    private List<SupportTicketDto> supportTickets;

    public CustomerHistoryDto() {
    }

    public CustomerHistoryDto(String customerId, String name, String email,
                              List<ParcelResponseDto> parcels,
                              List<PaymentResponseDto> payments,
                              List<SupportTicketDto> supportTickets) {
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.parcels = parcels;
        this.payments = payments;
        this.supportTickets = supportTickets;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<ParcelResponseDto> getParcels() {
        return parcels;
    }

    public void setParcels(List<ParcelResponseDto> parcels) {
        this.parcels = parcels;
    }

    public List<PaymentResponseDto> getPayments() {
        return payments;
    }

    public void setPayments(List<PaymentResponseDto> payments) {
        this.payments = payments;
    }

    public List<SupportTicketDto> getSupportTickets() {
        return supportTickets;
    }

    public void setSupportTickets(List<SupportTicketDto> supportTickets) {
        this.supportTickets = supportTickets;
    }
}
