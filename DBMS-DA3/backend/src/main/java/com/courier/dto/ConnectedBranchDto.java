package com.courier.dto;

public class ConnectedBranchDto {

    private String branchId;
    private String name;
    private String city;
    private long parcelsTraversed;

    public ConnectedBranchDto() {
    }

    public ConnectedBranchDto(String branchId, String name, String city, long parcelsTraversed) {
        this.branchId = branchId;
        this.name = name;
        this.city = city;
        this.parcelsTraversed = parcelsTraversed;
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

    public long getParcelsTraversed() {
        return parcelsTraversed;
    }

    public void setParcelsTraversed(long parcelsTraversed) {
        this.parcelsTraversed = parcelsTraversed;
    }
}
