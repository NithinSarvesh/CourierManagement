package com.courier.controller;

import com.courier.model.CardMode;
import com.courier.repository.CardModeRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/card-modes")
public class CardModeController {

    private final CardModeRepository repository;

    public CardModeController(CardModeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CardMode> getAllCardModes() {
        return repository.getAllCardModes();
    }

    @PostMapping
    public String addCardMode(@RequestBody CardMode mode) {
        repository.addCardMode(mode);
        return "Card mode added successfully";
    }

    @PutMapping("/{id}")
    public String updateCardMode(@PathVariable int id, @RequestBody CardMode mode) {
        repository.updateCardMode(id, mode);
        return "Card mode updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteCardMode(@PathVariable int id) {
        repository.deleteCardMode(id);
        return "Card mode deleted successfully";
    }
}