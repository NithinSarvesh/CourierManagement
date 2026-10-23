package com.courier.model;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.util.Objects;

@Node("Vehicle")
public class Vehicle {

    @Id
    private String vehicleId;
    private String type; // VAN, TRUCK, BIKE
    private String registration;
    private Double capacityKg;
    private String status = "AVAILABLE";

    public Vehicle() {
        this.status = "AVAILABLE";
    }

    public Vehicle(String vehicleId, String type, String registration, Double capacityKg) {
        this.vehicleId = vehicleId;
        this.type = type;
        this.registration = registration;
        this.capacityKg = capacityKg;
        this.status = "AVAILABLE";
    }

    public Vehicle(String vehicleId, String type, String registration, Double capacityKg, String status) {
        this.vehicleId = vehicleId;
        this.type = type;
        this.registration = registration;
        this.capacityKg = capacityKg;
        this.status = (status != null && !status.isBlank()) ? status : "AVAILABLE";
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Vehicle vehicle = (Vehicle) o;
        return Objects.equals(vehicleId, vehicle.vehicleId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(vehicleId);
    }
}
