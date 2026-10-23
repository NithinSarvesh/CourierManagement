package com.courier.dto;

public class CustomerResponseDto {

    private String customerId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private long totalParcelsBooked;

    public CustomerResponseDto() {
    }

    public CustomerResponseDto(String customerId, String name, String email, String phone, String address) {
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
    }

    public CustomerResponseDto(String customerId, String name, String email, String phone, String address, long totalParcelsBooked) {
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.totalParcelsBooked = totalParcelsBooked;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public long getTotalParcelsBooked() {
        return totalParcelsBooked;
    }

    public void setTotalParcelsBooked(long totalParcelsBooked) {
        this.totalParcelsBooked = totalParcelsBooked;
    }
}
