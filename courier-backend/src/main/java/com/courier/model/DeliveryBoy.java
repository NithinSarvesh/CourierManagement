package com.courier.model;

public class DeliveryBoy {

    private int courierId;
    private String areaAssigned;

    public DeliveryBoy() {}

    public DeliveryBoy(int courierId, String areaAssigned) {
        this.courierId = courierId;
        this.areaAssigned = areaAssigned;
    }

    public int getCourierId() {
        return courierId;
    }

    public void setCourierId(int courierId) {
        this.courierId = courierId;
    }

    public String getAreaAssigned() {
        return areaAssigned;
    }

    public void setAreaAssigned(String areaAssigned) {
        this.areaAssigned = areaAssigned;
    }
}