package com.courier.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ParcelBookingRequest {

    private String trackingNumber;

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    @NotBlank(message = "Origin branch ID is required")
    private String originBranchId;

    @NotBlank(message = "Destination branch ID is required")
    private String destinationBranchId;

    @NotBlank(message = "Service ID is required")
    private String serviceId;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "0.01", message = "Weight must be greater than 0 kg")
    private Double weight;

    public ParcelBookingRequest() {
    }

    public ParcelBookingRequest(String customerId, String originBranchId, String destinationBranchId, String serviceId, Double weight) {
        this.customerId = customerId;
        this.originBranchId = originBranchId;
        this.destinationBranchId = destinationBranchId;
        this.serviceId = serviceId;
        this.weight = weight;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getOriginBranchId() {
        return originBranchId;
    }

    public void setOriginBranchId(String originBranchId) {
        this.originBranchId = originBranchId;
    }

    public String getDestinationBranchId() {
        return destinationBranchId;
    }

    public void setDestinationBranchId(String destinationBranchId) {
        this.destinationBranchId = destinationBranchId;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }
}
