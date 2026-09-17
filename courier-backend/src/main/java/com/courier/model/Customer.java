package com.courier.model;

public class Customer {

    private int customerId;
    private String name;
    private String email;
    private String street;
    private String city;
    private String pin;

    public Customer() {
    }

    public Customer(int customerId, String name, String email, String street, String city, String pin) {
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.street = street;
        this.city = city;
        this.pin = pin;
    }

    public int getCustomerId() {
        return customerId;
    }

    public void setCustomerId(int customerId) {
        this.customerId = customerId;
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