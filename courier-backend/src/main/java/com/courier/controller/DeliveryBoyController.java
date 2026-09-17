package com.courier.controller;

import com.courier.model.DeliveryBoy;
import com.courier.repository.DeliveryBoyRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/delivery-boys")
public class DeliveryBoyController {

    private final DeliveryBoyRepository deliveryBoyRepository;

    public DeliveryBoyController(DeliveryBoyRepository deliveryBoyRepository) {
        this.deliveryBoyRepository = deliveryBoyRepository;
    }

    @GetMapping
    public List<DeliveryBoy> getAllDeliveryBoys() {
        return deliveryBoyRepository.getAllDeliveryBoys();
    }

    @GetMapping("/{id}")
    public DeliveryBoy getDeliveryBoyById(@PathVariable int id) {
        return deliveryBoyRepository.getDeliveryBoyById(id);
    }

    @PostMapping
    public String addDeliveryBoy(@RequestBody DeliveryBoy boy) {
        deliveryBoyRepository.addDeliveryBoy(boy);
        return "Delivery boy added successfully";
    }

    @PutMapping("/{id}")
    public String updateDeliveryBoy(@PathVariable int id, @RequestBody DeliveryBoy boy) {
        deliveryBoyRepository.updateDeliveryBoy(id, boy);
        return "Delivery boy updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteDeliveryBoy(@PathVariable int id) {
        deliveryBoyRepository.deleteDeliveryBoy(id);
        return "Delivery boy deleted successfully";
    }
}