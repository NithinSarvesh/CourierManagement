package com.courier.dto;

import java.util.List;

public class AgentDeliveriesDto {

    private String agentId;
    private String agentName;
    private String agentStatus;
    private List<ParcelResponseDto> pendingDeliveries;
    private List<ParcelResponseDto> completedDeliveries;

    public AgentDeliveriesDto() {
    }

    public AgentDeliveriesDto(String agentId, String agentName, String agentStatus,
                              List<ParcelResponseDto> pendingDeliveries,
                              List<ParcelResponseDto> completedDeliveries) {
        this.agentId = agentId;
        this.agentName = agentName;
        this.agentStatus = agentStatus;
        this.pendingDeliveries = pendingDeliveries;
        this.completedDeliveries = completedDeliveries;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public String getAgentStatus() {
        return agentStatus;
    }

    public void setAgentStatus(String agentStatus) {
        this.agentStatus = agentStatus;
    }

    public List<ParcelResponseDto> getPendingDeliveries() {
        return pendingDeliveries;
    }

    public void setPendingDeliveries(List<ParcelResponseDto> pendingDeliveries) {
        this.pendingDeliveries = pendingDeliveries;
    }

    public List<ParcelResponseDto> getCompletedDeliveries() {
        return completedDeliveries;
    }

    public void setCompletedDeliveries(List<ParcelResponseDto> completedDeliveries) {
        this.completedDeliveries = completedDeliveries;
    }
}
