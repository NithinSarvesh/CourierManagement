package com.courier.model;

public class CustomerSupport {

    private int staffId;
    private String staffTiming;

    public CustomerSupport() {}

    public CustomerSupport(int staffId, String staffTiming) {
        this.staffId = staffId;
        this.staffTiming = staffTiming;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public String getStaffTiming() {
        return staffTiming;
    }

    public void setStaffTiming(String staffTiming) {
        this.staffTiming = staffTiming;
    }
}