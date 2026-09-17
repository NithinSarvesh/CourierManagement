package com.courier.model;

public class Parcel {

    private int parcelId;
    private int orderId;
    private double price;
    private int courierId;
    private int staffId;

    public Parcel() {}

    public Parcel(int parcelId, int orderId, double price, int courierId, int staffId) {
        this.parcelId = parcelId;
        this.orderId = orderId;
        this.price = price;
        this.courierId = courierId;
        this.staffId = staffId;
    }

    public int getParcelId() {
        return parcelId;
    }

    public void setParcelId(int parcelId) {
        this.parcelId = parcelId;
    }

    public int getOrderId() {
        return orderId;
    }

    public void setOrderId(int orderId) {
        this.orderId = orderId;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public int getCourierId() {
        return courierId;
    }

    public void setCourierId(int courierId) {
        this.courierId = courierId;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }
}