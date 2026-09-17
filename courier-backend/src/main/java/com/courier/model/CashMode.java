package com.courier.model;

public class CashMode {

    private int paymentId;

    public CashMode() {}

    public CashMode(int paymentId) {
        this.paymentId = paymentId;
    }

    public int getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(int paymentId) {
        this.paymentId = paymentId;
    }
}