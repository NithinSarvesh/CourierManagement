package com.courier.model;

public class Vehicle {

    private String vehicleNo;
    private String licenseNo;
    private int staffId;

    public Vehicle() {}

    public Vehicle(String vehicleNo, String licenseNo, int staffId) {
        this.vehicleNo = vehicleNo;
        this.licenseNo = licenseNo;
        this.staffId = staffId;
    }

    public String getVehicleNo() {
        return vehicleNo;
    }

    public void setVehicleNo(String vehicleNo) {
        this.vehicleNo = vehicleNo;
    }

    public String getLicenseNo() {
        return licenseNo;
    }

    public void setLicenseNo(String licenseNo) {
        this.licenseNo = licenseNo;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }
}