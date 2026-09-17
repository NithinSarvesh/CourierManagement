package com.courier.model;

public class OnlineMode {

    private int paymentId;

    public OnlineMode() {}

    public OnlineMode(int paymentId) {
        this.paymentId = paymentId;
    }

    public int getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(int paymentId) {
        this.paymentId = paymentId;
    }
}