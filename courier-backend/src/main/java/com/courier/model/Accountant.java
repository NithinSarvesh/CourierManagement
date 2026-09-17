package com.courier.model;

public class Accountant {

    private int staffId;
    private String qualification;

    public Accountant() {}

    public Accountant(int staffId, String qualification) {
        this.staffId = staffId;
        this.qualification = qualification;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }
}