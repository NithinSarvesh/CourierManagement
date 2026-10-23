package com.courier.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CourierServiceDto {

    private String serviceId;

    @NotBlank(message = "Service name is required")
    private String name;

    @NotNull(message = "Estimated delivery days is required")
    @Min(value = 1, message = "Estimated days must be at least 1")
    private Integer estimatedDays;

    @NotNull(message = "Base charge is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Base charge must be greater than 0")
    private Double baseCharge;

    private String description;
    private Boolean active;

    public CourierServiceDto() {
    }

    public CourierServiceDto(String serviceId, String name, Integer estimatedDays, Double baseCharge) {
        this.serviceId = serviceId;
        this.name = name;
        this.estimatedDays = estimatedDays;
        this.baseCharge = baseCharge;
        this.active = true;
    }

    public CourierServiceDto(String serviceId, String name, Integer estimatedDays, Double baseCharge, String description, Boolean active) {
        this.serviceId = serviceId;
        this.name = name;
        this.estimatedDays = estimatedDays;
        this.baseCharge = baseCharge;
        this.description = description;
        this.active = active != null ? active : true;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getEstimatedDays() {
        return estimatedDays;
    }

    public void setEstimatedDays(Integer estimatedDays) {
        this.estimatedDays = estimatedDays;
    }

    public Double getBaseCharge() {
        return baseCharge;
    }

    public void setBaseCharge(Double baseCharge) {
        this.baseCharge = baseCharge;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
