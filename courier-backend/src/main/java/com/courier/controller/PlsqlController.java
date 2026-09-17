package com.courier.controller;

import com.courier.repository.PlsqlRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/plsql")
public class PlsqlController {

    private final PlsqlRepository plsqlRepository;

    public PlsqlController(PlsqlRepository plsqlRepository) {
        this.plsqlRepository = plsqlRepository;
    }

    @GetMapping("/customer-orders/{customerId}")
    public Map<String, Object> getCustomerOrderCount(@PathVariable int customerId) {
        int count = plsqlRepository.getCustomerOrderCount(customerId);

        return Map.of(
            "customerId", customerId,
            "totalOrders", count
        );
    }
}