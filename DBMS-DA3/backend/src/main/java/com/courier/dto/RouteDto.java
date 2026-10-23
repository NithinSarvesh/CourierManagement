package com.courier.dto;

import java.util.List;

public class RouteDto {

    private String originBranchId;
    private String originBranchName;
    private String originCity;
    private String destinationBranchId;
    private String destinationBranchName;
    private String destinationCity;
    private long parcelCount;
    private List<String> servicesUsed;
    private List<String> activeTrackingNumbers;

    public RouteDto() {
    }

    public RouteDto(String originBranchId, String originBranchName, String originCity,
                    String destinationBranchId, String destinationBranchName, String destinationCity,
                    long parcelCount, List<String> servicesUsed, List<String> activeTrackingNumbers) {
        this.originBranchId = originBranchId;
        this.originBranchName = originBranchName;
        this.originCity = originCity;
        this.destinationBranchId = destinationBranchId;
        this.destinationBranchName = destinationBranchName;
        this.destinationCity = destinationCity;
        this.parcelCount = parcelCount;
        this.servicesUsed = servicesUsed;
        this.activeTrackingNumbers = activeTrackingNumbers;
    }

    public String getOriginBranchId() {
        return originBranchId;
    }

    public void setOriginBranchId(String originBranchId) {
        this.originBranchId = originBranchId;
    }

    public String getOriginBranchName() {
        return originBranchName;
    }

    public void setOriginBranchName(String originBranchName) {
        this.originBranchName = originBranchName;
    }

    public String getOriginCity() {
        return originCity;
    }

    public void setOriginCity(String originCity) {
        this.originCity = originCity;
    }

    public String getDestinationBranchId() {
        return destinationBranchId;
    }

    public void setDestinationBranchId(String destinationBranchId) {
        this.destinationBranchId = destinationBranchId;
    }

    public String getDestinationBranchName() {
        return destinationBranchName;
    }

    public void setDestinationBranchName(String destinationBranchName) {
        this.destinationBranchName = destinationBranchName;
    }

    public String getDestinationCity() {
        return destinationCity;
    }

    public void setDestinationCity(String destinationCity) {
        this.destinationCity = destinationCity;
    }

    public long getParcelCount() {
        return parcelCount;
    }

    public void setParcelCount(long parcelCount) {
        this.parcelCount = parcelCount;
    }

    public List<String> getServicesUsed() {
        return servicesUsed;
    }

    public void setServicesUsed(List<String> servicesUsed) {
        this.servicesUsed = servicesUsed;
    }

    public List<String> getActiveTrackingNumbers() {
        return activeTrackingNumbers;
    }

    public void setActiveTrackingNumbers(List<String> activeTrackingNumbers) {
        this.activeTrackingNumbers = activeTrackingNumbers;
    }
}
