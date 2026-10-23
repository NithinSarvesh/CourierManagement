package com.courier.service;

import com.courier.dto.RouteDto;
import com.courier.repository.RouteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RouteService {

    private final RouteRepository routeRepository;

    public RouteService(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<RouteDto> exploreRoutes(String fromBranchId, String toBranchId) {
        List<Map<String, Object>> rows = routeRepository.exploreRoutes(fromBranchId, toBranchId);

        return rows.stream().map(row -> new RouteDto(
                (String) row.get("originBranchId"),
                (String) row.get("originBranchName"),
                (String) row.get("originCity"),
                (String) row.get("destinationBranchId"),
                (String) row.get("destinationBranchName"),
                (String) row.get("destinationCity"),
                ((Number) row.get("parcelCount")).longValue(),
                (List<String>) row.get("servicesUsed"),
                (List<String>) row.get("trackingNumbers")
        )).collect(Collectors.toList());
    }
}
