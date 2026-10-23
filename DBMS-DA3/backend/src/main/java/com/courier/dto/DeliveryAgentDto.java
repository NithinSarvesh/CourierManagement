package com.courier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class DeliveryAgentDto {

    private String agentId;

    @NotBlank(message = "Agent name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be between 10 and 15 digits")
    private String phone;

    private String status; // AVAILABLE, ON_DELIVERY, INACTIVE
    private String assignedVehicleId;
    private String assignedVehicleRegistration;
    private long activeDeliveriesCount;

    public DeliveryAgentDto() {
    }

    public DeliveryAgentDto(String agentId, String name, String phone, String status) {
        this.agentId = agentId;
        this.name = name;
        this.phone = phone;
        this.status = status;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAssignedVehicleId() {
        return assignedVehicleId;
    }

    public void setAssignedVehicleId(String assignedVehicleId) {
        this.assignedVehicleId = assignedVehicleId;
    }

    public String getAssignedVehicleRegistration() {
        return assignedVehicleRegistration;
    }

    public void setAssignedVehicleRegistration(String assignedVehicleRegistration) {
        this.assignedVehicleRegistration = assignedVehicleRegistration;
    }

    public long getActiveDeliveriesCount() {
        return activeDeliveriesCount;
    }

    public void setActiveDeliveriesCount(long activeDeliveriesCount) {
        this.activeDeliveriesCount = activeDeliveriesCount;
    }
}
