package com.courier.dto;

import jakarta.validation.constraints.NotBlank;

public class BranchDto {

    private String branchId;

    @NotBlank(message = "Branch name is required")
    private String name;

    @NotBlank(message = "City is required")
    private String city;

    private long originatingParcelsCount;
    private long destinedParcelsCount;

    public BranchDto() {
    }

    public BranchDto(String branchId, String name, String city) {
        this.branchId = branchId;
        this.name = name;
        this.city = city;
    }

    public BranchDto(String branchId, String name, String city, long originatingParcelsCount, long destinedParcelsCount) {
        this.branchId = branchId;
        this.name = name;
        this.city = city;
        this.originatingParcelsCount = originatingParcelsCount;
        this.destinedParcelsCount = destinedParcelsCount;
    }

    public String getBranchId() {
        return branchId;
    }

    public void setBranchId(String branchId) {
        this.branchId = branchId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public long getOriginatingParcelsCount() {
        return originatingParcelsCount;
    }

    public void setOriginatingParcelsCount(long originatingParcelsCount) {
        this.originatingParcelsCount = originatingParcelsCount;
    }

    public long getDestinedParcelsCount() {
        return destinedParcelsCount;
    }

    public void setDestinedParcelsCount(long destinedParcelsCount) {
        this.destinedParcelsCount = destinedParcelsCount;
    }
}
