package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.ApiResponse;
import com.test.app.TestAppBackEnd.models.PaymentRequest;
import com.test.app.TestAppBackEnd.entities.Payment;
import com.test.app.TestAppBackEnd.services.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/pay")
    public ResponseEntity<ApiResponse<Payment>> pay(@RequestBody PaymentRequest request) {
        Payment payment = paymentService.processPayment(request);
        ApiResponse<Payment> response = new ApiResponse<>(
                "Payment processed successfully",
                HttpStatus.OK.value(),
                payment,
                false
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments() {
        List<Payment> payments = paymentService.getAllPayments();
        ApiResponse<List<Payment>> response = new ApiResponse<>(
                "Fetched all payments",
                HttpStatus.OK.value(),
                payments,
                false
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/client/{username}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByClient(@PathVariable String username) {
        List<Payment> payments = paymentService.getPaymentsByClient(username);
        ApiResponse<List<Payment>> response = new ApiResponse<>(
                "Fetched payments for client: " + username,
                HttpStatus.OK.value(),
                payments,
                false
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByMechanic(@PathVariable Long mechanicId) {
        List<Payment> payments = paymentService.getPaymentsByMechanic(mechanicId);
        ApiResponse<List<Payment>> response = new ApiResponse<>(
                "Fetched payments for mechanic ID: " + mechanicId,
                HttpStatus.OK.value(),
                payments,
                false
        );
        return ResponseEntity.ok(response);
    }
}
