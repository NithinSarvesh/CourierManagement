package com.courier.model;

public class CourierService {

    private int serviceId;
    private int branchId;
    private int courierId;
    private double charges;

    public CourierService() {
    }

    public CourierService(int serviceId, int branchId, int courierId, double charges) {
        this.serviceId = serviceId;
        this.branchId = branchId;
        this.courierId = courierId;
        this.charges = charges;
    }

    public int getServiceId() {
        return serviceId;
    }

    public void setServiceId(int serviceId) {
        this.serviceId = serviceId;
    }

    public int getBranchId() {
        return branchId;
    }

    public void setBranchId(int branchId) {
        this.branchId = branchId;
    }

    public int getCourierId() {
        return courierId;
    }

    public void setCourierId(int courierId) {
        this.courierId = courierId;
    }

    public double getCharges() {
        return charges;
    }

    public void setCharges(double charges) {
        this.charges = charges;
    }
}