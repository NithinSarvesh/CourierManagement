package com.courier.controller;

import com.courier.model.Driver;
import com.courier.repository.DriverRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverRepository driverRepository;

    public DriverController(DriverRepository driverRepository) {
        this.driverRepository = driverRepository;
    }

    @GetMapping
    public List<Driver> getAllDrivers() {
        return driverRepository.getAllDrivers();
    }

    @GetMapping("/{id}")
    public Driver getDriverById(@PathVariable int id) {
        return driverRepository.getDriverById(id);
    }

    @PostMapping
    public String addDriver(@RequestBody Driver driver) {
        driverRepository.addDriver(driver);
        return "Driver added successfully";
    }

    @PutMapping("/{id}")
    public String updateDriver(@PathVariable int id, @RequestBody Driver driver) {
        driverRepository.updateDriver(id, driver);
        return "Driver updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteDriver(@PathVariable int id) {
        driverRepository.deleteDriver(id);
        return "Driver deleted successfully";
    }
}