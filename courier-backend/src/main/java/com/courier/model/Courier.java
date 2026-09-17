package com.courier.model;

public class Courier {

    private int courierId;
    private String name;
    private String email;

    public Courier() {
    }

    public Courier(int courierId, String name, String email) {
        this.courierId = courierId;
        this.name = name;
        this.email = email;
    }

    public int getCourierId() {
        return courierId;
    }

    public void setCourierId(int courierId) {
        this.courierId = courierId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}