package com.courier.dto;

public class PaymentSummaryDto {

    private Double totalCollectedRevenue;
    private Double pendingPaymentAmount;
    private long totalTransactions;
    private long paidCount;
    private long pendingCount;
    private long failedCount;

    public PaymentSummaryDto() {
    }

    public PaymentSummaryDto(Double totalCollectedRevenue, Double pendingPaymentAmount, long totalTransactions,
                             long paidCount, long pendingCount, long failedCount) {
        this.totalCollectedRevenue = totalCollectedRevenue;
        this.pendingPaymentAmount = pendingPaymentAmount;
        this.totalTransactions = totalTransactions;
        this.paidCount = paidCount;
        this.pendingCount = pendingCount;
        this.failedCount = failedCount;
    }

    public Double getTotalCollectedRevenue() {
        return totalCollectedRevenue;
    }

    public void setTotalCollectedRevenue(Double totalCollectedRevenue) {
        this.totalCollectedRevenue = totalCollectedRevenue;
    }

    public Double getPendingPaymentAmount() {
        return pendingPaymentAmount;
    }

    public void setPendingPaymentAmount(Double pendingPaymentAmount) {
        this.pendingPaymentAmount = pendingPaymentAmount;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public long getPaidCount() {
        return paidCount;
    }

    public void setPaidCount(long paidCount) {
        this.paidCount = paidCount;
    }

    public long getPendingCount() {
        return pendingCount;
    }

    public void setPendingCount(long pendingCount) {
        this.pendingCount = pendingCount;
    }

    public long getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(long failedCount) {
        this.failedCount = failedCount;
    }
}
