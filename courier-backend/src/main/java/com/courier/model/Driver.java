package com.courier.model;

public class Driver {

    private int courierId;
    private String licenseNo;

    public Driver() {}

    public Driver(int courierId, String licenseNo) {
        this.courierId = courierId;
        this.licenseNo = licenseNo;
    }

    public int getCourierId() {
        return courierId;
    }

    public void setCourierId(int courierId) {
        this.courierId = courierId;
    }

    public String getLicenseNo() {
        return licenseNo;
    }

    public void setLicenseNo(String licenseNo) {
        this.licenseNo = licenseNo;
    }
}