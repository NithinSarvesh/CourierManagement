package com.courier.controller;

import com.courier.model.Payment;
import com.courier.repository.PaymentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;

    public PaymentController(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentRepository.getAllPayments();
    }

    @GetMapping("/{id}")
    public Payment getPaymentById(@PathVariable int id) {
        return paymentRepository.getPaymentById(id);
    }

    @PostMapping
    public String addPayment(@RequestBody Payment payment) {
        paymentRepository.addPayment(payment);
        return "Payment added successfully";
    }

    @PutMapping("/{id}")
    public String updatePayment(@PathVariable int id, @RequestBody Payment payment) {
        paymentRepository.updatePayment(id, payment);
        return "Payment updated successfully";
    }

    @DeleteMapping("/{id}")
    public String deletePayment(@PathVariable int id) {
        paymentRepository.deletePayment(id);
        return "Payment deleted successfully";
    }
    @GetMapping("/search")
    public List<Payment> searchPayments(@RequestParam String status) {
        return paymentRepository.searchPayments(status);
    }

    @GetMapping("/customer/{customerId}")
public List<Payment> getPaymentsByCustomerId(@PathVariable int customerId) {
    return paymentRepository.getPaymentsByCustomerId(customerId);
}

    @GetMapping("/order/{orderId}")
public List<Payment> getPaymentsByOrderId(@PathVariable int orderId) {
    return paymentRepository.getPaymentsByOrderId(orderId);
}
}