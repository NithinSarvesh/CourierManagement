package com.courier.repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PaymentRepositoryCustom {

    Optional<Map<String, Object>> findPaymentDetailsById(String paymentId);

    Optional<Map<String, Object>> findPaymentByParcel(String trackingNumber);

    List<Map<String, Object>> findPaymentsByCustomer(String customerId);

    List<Map<String, Object>> findAllPaymentsPaged(String status, String method, long skip, int limit);

    Map<String, Object> addPaymentToParcel(String trackingNumber,
                                          String paymentId,
                                          Double amount,
                                          String method,
                                          String status,
                                          String paymentDate,
                                          String transactionRef);
}
