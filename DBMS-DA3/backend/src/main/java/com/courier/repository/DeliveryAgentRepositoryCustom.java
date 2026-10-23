package com.courier.repository;

import java.util.Map;
import java.util.Optional;

public interface DeliveryAgentRepositoryCustom {

    Optional<Map<String, Object>> findAssignedVehicle(String agentId);
}
