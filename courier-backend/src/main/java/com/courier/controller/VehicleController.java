package com.courier.controller;

import com.courier.model.Vehicle;
import com.courier.repository.VehicleRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.getAllVehicles();
    }

    @GetMapping("/{vehicleNo}")
    public Vehicle getVehicleById(@PathVariable String vehicleNo) {
        return vehicleRepository.getVehicleById(vehicleNo);
    }

    @PostMapping
    public String addVehicle(@RequestBody Vehicle vehicle) {
        vehicleRepository.addVehicle(vehicle);
        return "Vehicle added successfully";
    }

    @PutMapping("/{vehicleNo}")
    public String updateVehicle(@PathVariable String vehicleNo, @RequestBody Vehicle vehicle) {
        vehicleRepository.updateVehicle(vehicleNo, vehicle);
        return "Vehicle updated successfully";
    }

    @DeleteMapping("/{vehicleNo}")
    public String deleteVehicle(@PathVariable String vehicleNo) {
        vehicleRepository.deleteVehicle(vehicleNo);
        return "Vehicle deleted successfully";
    }
}