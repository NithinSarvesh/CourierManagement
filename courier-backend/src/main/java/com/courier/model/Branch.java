package com.courier.model;

public class Branch {

    private int branchId;
    private String branchName;
    private String street;
    private String city;
    private String pin;

    public Branch() {
    }

    public Branch(int branchId, String branchName, String street, String city, String pin) {
        this.branchId = branchId;
        this.branchName = branchName;
        this.street = street;
        this.city = city;
        this.pin = pin;
    }

    public int getBranchId() {
        return branchId;
    }

    public void setBranchId(int branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }
}