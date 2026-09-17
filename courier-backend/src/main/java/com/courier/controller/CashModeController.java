package com.courier.controller;

import com.courier.model.CashMode;
import com.courier.repository.CashModeRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cash-modes")
public class CashModeController {

    private final CashModeRepository repository;

    public CashModeController(CashModeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CashMode> getAllCashModes() {
        return repository.getAllCashModes();
    }

    @PostMapping
    public String addCashMode(@RequestBody CashMode mode) {
        repository.addCashMode(mode);
        return "Cash mode added successfully";
    }

    @PutMapping("/{id}")
    public String updateCashMode(@PathVariable int id, @RequestBody CashMode mode) {
        repository.updateCashMode(id, mode);
        return "Cash mode updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteCashMode(@PathVariable int id) {
        repository.deleteCashMode(id);
        return "Cash mode deleted successfully";
    }
}