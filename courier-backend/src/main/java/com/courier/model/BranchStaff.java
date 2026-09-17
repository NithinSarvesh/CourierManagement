package com.courier.model;

public class BranchStaff {

    private int courierId;
    private String department;

    public BranchStaff() {}

    public BranchStaff(int courierId, String department) {
        this.courierId = courierId;
        this.department = department;
    }

    public int getCourierId() {
        return courierId;
    }

    public void setCourierId(int courierId) {
        this.courierId = courierId;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}