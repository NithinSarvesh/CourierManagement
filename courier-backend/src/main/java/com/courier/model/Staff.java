package com.courier.model;

public class Staff {

    private int staffId;
    private String role;
    private int branchId;
    private String name;
    private String department;

    public Staff() {
    }

    public Staff(int staffId, String role, int branchId, String name, String department) {
        this.staffId = staffId;
        this.role = role;
        this.branchId = branchId;
        this.name = name;
        this.department = department;
    }

    public int getStaffId() {
        return staffId;
    }

    public void setStaffId(int staffId) {
        this.staffId = staffId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public int getBranchId() {
        return branchId;
    }

    public void setBranchId(int branchId) {
        this.branchId = branchId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }
}