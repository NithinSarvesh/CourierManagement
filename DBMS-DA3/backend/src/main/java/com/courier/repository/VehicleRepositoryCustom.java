package com.courier.repository;

import java.util.List;
import java.util.Optional;

public interface VehicleRepositoryCustom {

    Optional<VehicleDetailsProjection> findVehicleDetails(String vehicleId);

    List<VehicleDetailsProjection> findAllVehiclesWithAgent();
}
