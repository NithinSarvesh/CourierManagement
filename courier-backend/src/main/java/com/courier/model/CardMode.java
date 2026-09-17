package com.courier.model;

public class CardMode {

    private int paymentId;

    public CardMode() {}

    public CardMode(int paymentId) {
        this.paymentId = paymentId;
    }

    public int getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(int paymentId) {
        this.paymentId = paymentId;
    }
}