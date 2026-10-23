package com.courier.model;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.util.Objects;

@Node("CourierService")
public class CourierService {

    @Id
    private String serviceId;
    private String name;
    private Integer estimatedDays;
    private Double baseCharge;
    private String description;
    private Boolean active = true;

    public CourierService() {
    }

    public CourierService(String serviceId, String name, Integer estimatedDays, Double baseCharge) {
        this.serviceId = serviceId;
        this.name = name;
        this.estimatedDays = estimatedDays;
        this.baseCharge = baseCharge;
        this.active = true;
    }

    public CourierService(String serviceId, String name, Integer estimatedDays, Double baseCharge, String description, Boolean active) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CourierService that = (CourierService) o;
        return Objects.equals(serviceId, that.serviceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(serviceId);
    }
}
