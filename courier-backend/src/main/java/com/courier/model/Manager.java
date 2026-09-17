package com.courier.model;

public class Manager {

    private int staffId;
    private int managerId;

    public Manager() {}

    public Manager(int staffId, int managerId) {
        this.staffId = staffId;
        this.managerId = managerId;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public int getManagerId() {
        return managerId;
    }

    public void setManagerId(int managerId) {
        this.managerId = managerId;
    }
}