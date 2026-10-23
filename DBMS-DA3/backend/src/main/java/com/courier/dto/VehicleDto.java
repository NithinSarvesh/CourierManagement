package com.courier.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VehicleDto {

    private String vehicleId;

    @NotBlank(message = "Vehicle type is required (VAN, TRUCK, BIKE)")
    private String type;

    @NotBlank(message = "Registration number is required")
    private String registration;

    @NotNull(message = "Capacity in kg is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Capacity must be greater than 0")
    private Double capacityKg;

    private String status;
    private String assignedAgentId;
    private String assignedAgentName;

    public VehicleDto() {
    }

    public VehicleDto(String vehicleId, String type, String registration, Double capacityKg) {
        this.vehicleId = vehicleId;
        this.type = type;
        this.registration = registration;
        this.capacityKg = capacityKg;
        this.status = "ACTIVE";
    }

    public VehicleDto(String vehicleId, String type, String registration, Double capacityKg, String status, String assignedAgentId, String assignedAgentName) {
        this.vehicleId = vehicleId;
        this.type = type;
        this.registration = registration;
        this.capacityKg = capacityKg;
        this.status = status;
        this.assignedAgentId = assignedAgentId;
        this.assignedAgentName = assignedAgentName;
    }

    public String getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRegistration() {
        return registration;
    }

    public void setRegistration(String registration) {
        this.registration = registration;
    }

    public Double getCapacityKg() {
        return capacityKg;
    }

    public void setCapacityKg(Double capacityKg) {
        this.capacityKg = capacityKg;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAssignedAgentId() {
        return assignedAgentId;
    }

    public void setAssignedAgentId(String assignedAgentId) {
        this.assignedAgentId = assignedAgentId;
    }

    public String getAssignedAgentName() {
        return assignedAgentName;
    }

    public void setAssignedAgentName(String assignedAgentName) {
        this.assignedAgentName = assignedAgentName;
    }
}
