package com.courier.model;

import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

import java.util.Objects;

@Node("DeliveryAgent")
public class DeliveryAgent {

    @Id
    private String agentId;
    private String name;
    private String phone;
    private String status; // AVAILABLE, ON_DELIVERY, INACTIVE

    public DeliveryAgent() {
    }

    public DeliveryAgent(String agentId, String name, String phone, String status) {
        this.agentId = agentId;
        this.name = name;
        this.phone = phone;
        this.status = status;
    }

    public String getAgentId() {
        return agentId;
    }

    public void setAgentId(String agentId) {
        this.agentId = agentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DeliveryAgent that = (DeliveryAgent) o;
        return Objects.equals(agentId, that.agentId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(agentId);
    }
}
