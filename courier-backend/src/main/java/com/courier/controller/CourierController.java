package com.courier.controller;

import com.courier.model.Courier;
import com.courier.repository.CourierRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/couriers")
public class CourierController {

    private final CourierRepository courierRepository;

    public CourierController(CourierRepository courierRepository) {
        this.courierRepository = courierRepository;
    }

    @GetMapping
    public List<Courier> getAllCouriers() {
        return courierRepository.getAllCouriers();
    }

    @GetMapping("/{id}")
    public Courier getCourierById(@PathVariable int id) {
        return courierRepository.getCourierById(id);
    }

    @PostMapping
    public String addCourier(@RequestBody Courier courier) {
        courierRepository.addCourier(courier);
        return "Courier added successfully";
    }

    @PutMapping("/{id}")
    public String updateCourier(@PathVariable int id, @RequestBody Courier courier) {
        courierRepository.updateCourier(id, courier);
        return "Courier updated successfully";
    }
    @GetMapping("/search")
    public List<Courier> searchCouriers(@RequestParam String name) {
        return courierRepository.searchCouriers(name);
    }

    @DeleteMapping("/{id}")
    public String deleteCourier(@PathVariable int id) {
        courierRepository.deleteCourier(id);
        return "Courier deleted successfully";
    }
}