package com.courier.dto;

import jakarta.validation.constraints.DecimalMin;

public class ParcelUpdateRequest {

    @DecimalMin(value = "0.01", message = "Weight must be greater than 0 kg")
    private Double weight;

    private String destinationBranchId;
    private String serviceId;

    public ParcelUpdateRequest() {
    }

    public ParcelUpdateRequest(Double weight) {
        this.weight = weight;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
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
}
