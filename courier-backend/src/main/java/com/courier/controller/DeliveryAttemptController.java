package com.courier.controller;

import com.courier.model.DeliveryAttempt;
import com.courier.repository.DeliveryAttemptRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-attempts")
public class DeliveryAttemptController {

    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public DeliveryAttemptController(DeliveryAttemptRepository deliveryAttemptRepository) {
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    @GetMapping
    public List<DeliveryAttempt> getAllDeliveryAttempts() {
        return deliveryAttemptRepository.getAllDeliveryAttempts();
    }

    @PostMapping
    public String addDeliveryAttempt(@RequestBody DeliveryAttempt attempt) {
        deliveryAttemptRepository.addDeliveryAttempt(attempt);
        return "Delivery attempt added successfully";
    }

    @PutMapping("/{branchId}/{attemptNo}")
    public String updateDeliveryAttempt(
            @PathVariable int branchId,
            @PathVariable int attemptNo,
            @RequestBody DeliveryAttempt attempt) {

        deliveryAttemptRepository.updateDeliveryAttempt(branchId, attemptNo, attempt);
        return "Delivery attempt updated successfully";
    }

    @DeleteMapping("/{branchId}/{attemptNo}")
    public String deleteDeliveryAttempt(
            @PathVariable int branchId,
            @PathVariable int attemptNo) {

        deliveryAttemptRepository.deleteDeliveryAttempt(branchId, attemptNo);
        return "Delivery attempt deleted successfully";
    }
}