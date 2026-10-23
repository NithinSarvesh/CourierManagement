package com.courier.dto;

import java.util.ArrayList;
import java.util.List;

public class ParcelResponseDto {

    private String trackingNumber;
    private Double weight;
    private Double deliveryCharge;
    private String status;

    private CustomerResponseDto customer;
    private BranchDto originBranch;
    private BranchDto destinationBranch;
    private CourierServiceDto courierService;
    private DeliveryAgentDto assignedAgent;
    private PaymentResponseDto payment;
    private List<TrackingEventResponseDto> trackingEvents = new ArrayList<>();
    private List<DeliveryAttemptDto> deliveryAttempts = new ArrayList<>();

    public ParcelResponseDto() {
    }

    public ParcelResponseDto(String trackingNumber, Double weight, Double deliveryCharge, String status) {
        this.trackingNumber = trackingNumber;
        this.weight = weight;
        this.deliveryCharge = deliveryCharge;
        this.status = status;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getDeliveryCharge() {
        return deliveryCharge;
    }

    public void setDeliveryCharge(Double deliveryCharge) {
        this.deliveryCharge = deliveryCharge;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public CustomerResponseDto getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerResponseDto customer) {
        this.customer = customer;
    }

    public BranchDto getOriginBranch() {
        return originBranch;
    }

    public void setOriginBranch(BranchDto originBranch) {
        this.originBranch = originBranch;
    }

    public BranchDto getDestinationBranch() {
        return destinationBranch;
    }

    public void setDestinationBranch(BranchDto destinationBranch) {
        this.destinationBranch = destinationBranch;
    }

    public CourierServiceDto getCourierService() {
        return courierService;
    }

    public void setCourierService(CourierServiceDto courierService) {
        this.courierService = courierService;
    }

    public DeliveryAgentDto getAssignedAgent() {
        return assignedAgent;
    }

    public void setAssignedAgent(DeliveryAgentDto assignedAgent) {
        this.assignedAgent = assignedAgent;
    }

    public PaymentResponseDto getPayment() {
        return payment;
    }

    public void setPayment(PaymentResponseDto payment) {
        this.payment = payment;
    }

    public List<TrackingEventResponseDto> getTrackingEvents() {
        return trackingEvents;
    }

    public void setTrackingEvents(List<TrackingEventResponseDto> trackingEvents) {
        this.trackingEvents = trackingEvents != null ? trackingEvents : new ArrayList<>();
    }

    public List<DeliveryAttemptDto> getDeliveryAttempts() {
        return deliveryAttempts;
    }

    public void setDeliveryAttempts(List<DeliveryAttemptDto> deliveryAttempts) {
        this.deliveryAttempts = deliveryAttempts != null ? deliveryAttempts : new ArrayList<>();
    }
}
