package com.courier.controller;

import com.courier.model.Customer;
import com.courier.repository.CustomerRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }
    @GetMapping("/search")
    public List<Customer> searchCustomers(@RequestParam String name) {
        return customerRepository.searchCustomers(name);
    }

    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.getAllCustomers();
    }

    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable int id) {
        return customerRepository.getCustomerById(id);
    }

    @PostMapping
    public String addCustomer(@RequestBody Customer customer) {
        customerRepository.addCustomer(customer);
        return "Customer added successfully";
    }

    @PutMapping("/{id}")
    public String updateCustomer(@PathVariable int id, @RequestBody Customer customer) {
        customerRepository.updateCustomer(id, customer);
        return "Customer updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deleteCustomer(@PathVariable int id) {
        customerRepository.deleteCustomer(id);
        return "Customer deleted successfully";
    }
}