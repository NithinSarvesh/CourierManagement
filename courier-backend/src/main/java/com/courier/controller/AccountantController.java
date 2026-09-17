package com.courier.controller;

import com.courier.model.Accountant;
import com.courier.repository.AccountantRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/accountants")
public class AccountantController {

    private final AccountantRepository accountantRepository;

    public AccountantController(AccountantRepository accountantRepository) {
        this.accountantRepository = accountantRepository;
    }

    @GetMapping
    public List<Accountant> getAllAccountants() {
        return accountantRepository.getAllAccountants();
    }

    @GetMapping("/{id}")
    public Accountant getAccountantById(@PathVariable int id) {
        return accountantRepository.getAccountantById(id);
    }

    @PostMapping
    public String addAccountant(@RequestBody Accountant accountant) {
        accountantRepository.addAccountant(accountant);
        return "Accountant added successfully";
    }

    @PutMapping("/{id}")
    public String updateAccountant(@PathVariable int id, @RequestBody Accountant accountant) {
        accountantRepository.updateAccountant(id, accountant);
        return "Accountant updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteAccountant(@PathVariable int id) {
        accountantRepository.deleteAccountant(id);
        return "Accountant deleted successfully";
    }
}