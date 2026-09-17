package com.courier.controller;

import com.courier.model.Manager;
import com.courier.repository.ManagerRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/managers")
public class ManagerController {

    private final ManagerRepository managerRepository;

    public ManagerController(ManagerRepository managerRepository) {
        this.managerRepository = managerRepository;
    }

    @GetMapping
    public List<Manager> getAllManagers() {
        return managerRepository.getAllManagers();
    }

    @GetMapping("/{id}")
    public Manager getManagerById(@PathVariable int id) {
        return managerRepository.getManagerById(id);
    }

    @PostMapping
    public String addManager(@RequestBody Manager manager) {
        managerRepository.addManager(manager);
        return "Manager added successfully";
    }

    @PutMapping("/{id}")
    public String updateManager(@PathVariable int id, @RequestBody Manager manager) {
        managerRepository.updateManager(id, manager);
        return "Manager updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteManager(@PathVariable int id) {
        managerRepository.deleteManager(id);
        return "Manager deleted successfully";
    }
}