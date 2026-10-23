package com.courier.dto;

import java.util.List;
import java.util.Map;

public class DashboardSummaryDto {

    private long totalCustomers;
    private long totalParcels;
    private long deliveredParcelsCount;
    private long pendingParcelsCount;
    private Map<String, Long> parcelsByStatus;

    private Double totalCollectedRevenue;
    private Double pendingPaymentTotal;

    private long successfulDeliveriesCount;
    private long failedDeliveriesCount;

    private Map<String, Long> courierServiceUsage;
    private Map<String, Map<String, Long>> branchParcelCounts;
    private Map<String, Long> agentWorkload;

    private List<ParcelResponseDto> recentBookings;
    private List<TrackingEventResponseDto> recentTrackingEvents;

    public DashboardSummaryDto() {
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalParcels() {
        return totalParcels;
    }

    public void setTotalParcels(long totalParcels) {
        this.totalParcels = totalParcels;
    }

    public long getDeliveredParcelsCount() {
        return deliveredParcelsCount;
    }

    public void setDeliveredParcelsCount(long deliveredParcelsCount) {
        this.deliveredParcelsCount = deliveredParcelsCount;
    }

    public long getPendingParcelsCount() {
        return pendingParcelsCount;
    }

    public void setPendingParcelsCount(long pendingParcelsCount) {
        this.pendingParcelsCount = pendingParcelsCount;
    }

    public Map<String, Long> getParcelsByStatus() {
        return parcelsByStatus;
    }

    public void setParcelsByStatus(Map<String, Long> parcelsByStatus) {
        this.parcelsByStatus = parcelsByStatus;
    }

    public Double getTotalCollectedRevenue() {
        return totalCollectedRevenue;
    }

    public void setTotalCollectedRevenue(Double totalCollectedRevenue) {
        this.totalCollectedRevenue = totalCollectedRevenue;
    }

    public Double getPendingPaymentTotal() {
        return pendingPaymentTotal;
    }

    public void setPendingPaymentTotal(Double pendingPaymentTotal) {
        this.pendingPaymentTotal = pendingPaymentTotal;
    }

    public long getSuccessfulDeliveriesCount() {
        return successfulDeliveriesCount;
    }

    public void setSuccessfulDeliveriesCount(long successfulDeliveriesCount) {
        this.successfulDeliveriesCount = successfulDeliveriesCount;
    }

    public long getFailedDeliveriesCount() {
        return failedDeliveriesCount;
    }

    public void setFailedDeliveriesCount(long failedDeliveriesCount) {
        this.failedDeliveriesCount = failedDeliveriesCount;
    }

    public Map<String, Long> getCourierServiceUsage() {
        return courierServiceUsage;
    }

    public void setCourierServiceUsage(Map<String, Long> courierServiceUsage) {
        this.courierServiceUsage = courierServiceUsage;
    }

    public Map<String, Map<String, Long>> getBranchParcelCounts() {
        return branchParcelCounts;
    }

    public void setBranchParcelCounts(Map<String, Map<String, Long>> branchParcelCounts) {
        this.branchParcelCounts = branchParcelCounts;
    }

    public Map<String, Long> getAgentWorkload() {
        return agentWorkload;
    }

    public void setAgentWorkload(Map<String, Long> agentWorkload) {
        this.agentWorkload = agentWorkload;
    }

    public List<ParcelResponseDto> getRecentBookings() {
        return recentBookings;
    }

    public void setRecentBookings(List<ParcelResponseDto> recentBookings) {
        this.recentBookings = recentBookings;
    }

    public List<TrackingEventResponseDto> getRecentTrackingEvents() {
        return recentTrackingEvents;
    }

    public void setRecentTrackingEvents(List<TrackingEventResponseDto> recentTrackingEvents) {
        this.recentTrackingEvents = recentTrackingEvents;
    }
}
