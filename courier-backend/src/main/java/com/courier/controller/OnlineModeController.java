package com.courier.controller;

import com.courier.model.OnlineMode;
import com.courier.repository.OnlineModeRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/online-modes")
public class OnlineModeController {

    private final OnlineModeRepository repository;

    public OnlineModeController(OnlineModeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<OnlineMode> getAllOnlineModes() {
        return repository.getAllOnlineModes();
    }

    @PostMapping
    public String addOnlineMode(@RequestBody OnlineMode mode) {
        repository.addOnlineMode(mode);
        return "Online mode added successfully";
    }

    @PutMapping("/{id}")
    public String updateOnlineMode(@PathVariable int id, @RequestBody OnlineMode mode) {
        repository.updateOnlineMode(id, mode);
        return "Online mode updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteOnlineMode(@PathVariable int id) {
        repository.deleteOnlineMode(id);
        return "Online mode deleted successfully";
    }
}