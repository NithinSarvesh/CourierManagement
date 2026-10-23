package com.courier.repository;

public class VehicleDetailsProjection {
    private final String vehicleId;
    private final String type;
    private final String registration;
    private final Double capacityKg;
    private final String status;
    private final String assignedAgentId;
    private final String assignedAgentName;

    public VehicleDetailsProjection(
            String vehicleId,
            String type,
            String registration,
            Double capacityKg,
            String status,
            String assignedAgentId,
            String assignedAgentName) {
        this.vehicleId = vehicleId;
        this.type = type;
        this.registration = registration;
        this.capacityKg = capacityKg;
        this.status = status;
        this.assignedAgentId = assignedAgentId;
        this.assignedAgentName = assignedAgentName;
    }

    public String getVehicleId() { return vehicleId; }
    public String getType() { return type; }
    public String getRegistration() { return registration; }
    public Double getCapacityKg() { return capacityKg; }
    public String getStatus() { return status; }
    public String getAssignedAgentId() { return assignedAgentId; }
    public String getAssignedAgentName() { return assignedAgentName; }
}