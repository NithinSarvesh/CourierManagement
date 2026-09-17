package com.courier.controller;

import com.courier.model.CourierService;
import com.courier.repository.CourierServiceRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courier-services")
public class CourierServiceController {

    private final CourierServiceRepository courierServiceRepository;

    public CourierServiceController(CourierServiceRepository courierServiceRepository) {
        this.courierServiceRepository = courierServiceRepository;
    }

    @GetMapping
    public List<CourierService> getAllServices() {
        return courierServiceRepository.getAllServices();
    }

    @GetMapping("/{id}")
    public CourierService getServiceById(@PathVariable int id) {
        return courierServiceRepository.getServiceById(id);
    }

    @PostMapping
    public String addService(@RequestBody CourierService service) {
        courierServiceRepository.addService(service);
        return "Courier service added successfully";
    }

    @PutMapping("/{id}")
    public String updateService(@PathVariable int id, @RequestBody CourierService service) {
        courierServiceRepository.updateService(id, service);
        return "Courier service updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteService(@PathVariable int id) {
        courierServiceRepository.deleteService(id);
        return "Courier service deleted successfully";
    }

    @GetMapping("/branch/{branchId}")
public List<CourierService> getServicesByBranchId(@PathVariable int branchId) {
    return courierServiceRepository.getServicesByBranchId(branchId);
}
}