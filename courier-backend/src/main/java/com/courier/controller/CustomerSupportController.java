package com.courier.controller;

import com.courier.model.CustomerSupport;
import com.courier.repository.CustomerSupportRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/customer-support")
public class CustomerSupportController {

    private final CustomerSupportRepository customerSupportRepository;

    public CustomerSupportController(CustomerSupportRepository customerSupportRepository) {
        this.customerSupportRepository = customerSupportRepository;
    }

    @GetMapping
    public List<CustomerSupport> getAllCustomerSupport() {
        return customerSupportRepository.getAllCustomerSupport();
    }

    @GetMapping("/{id}")
    public CustomerSupport getCustomerSupportById(@PathVariable int id) {
        return customerSupportRepository.getCustomerSupportById(id);
    }

    @PostMapping
    public String addCustomerSupport(@RequestBody CustomerSupport support) {
        customerSupportRepository.addCustomerSupport(support);
        return "Customer support added successfully";
    }

    @PutMapping("/{id}")
    public String updateCustomerSupport(@PathVariable int id, @RequestBody CustomerSupport support) {
        customerSupportRepository.updateCustomerSupport(id, support);
        return "Customer support updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteCustomerSupport(@PathVariable int id) {
        customerSupportRepository.deleteCustomerSupport(id);
        return "Customer support deleted successfully";
    }
}