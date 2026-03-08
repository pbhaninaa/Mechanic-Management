package com.test.app.TestAppBackEnd.controllers;

import com.stripe.exception.StripeException;
import com.test.app.TestAppBackEnd.constants.Role;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.models.ApiResponse;
import com.test.app.TestAppBackEnd.models.PaymentRequest;
import com.test.app.TestAppBackEnd.entities.Payment;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import com.test.app.TestAppBackEnd.services.PaymentService;
import com.test.app.TestAppBackEnd.services.StripeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private StripeService stripeService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private boolean isAdmin(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ADMIN".equals(a.getAuthority()));
    }

    /** Resolve current user's profile for payment scoping (non-admin see only their own). */
    private Optional<UserProfile> currentProfile(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) return Optional.empty();
        return userProfileRepository.findByUsername(auth.getName());
    }

    /** Create Stripe PaymentIntent for card payments - returns clientSecret for frontend */
    @PostMapping("/create-intent")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPaymentIntent(@RequestBody PaymentRequest request) {
        if (request.getAmount() == null || request.getJobId() == null || request.getClientUsername() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("amount, jobId and clientUsername required", HttpStatus.BAD_REQUEST.value(), null));
        }
        try {
            long amountCents = Math.round(request.getAmount() * 100);
            if (amountCents < 50) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse<>("Amount must be at least R0.50", HttpStatus.BAD_REQUEST.value(), null));
            }
            Map<String, String> intent = stripeService.createPaymentIntent(
                    amountCents,
                    "zar",
                    request.getClientUsername(),
                    request.getJobId(),
                    request.getMechanicId(),
                    request.getCarWashId()
            );
            return ResponseEntity.ok(new ApiResponse<>("Payment intent created", HttpStatus.OK.value(), intent));
        } catch (StripeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("Stripe error: " + e.getMessage(), HttpStatus.BAD_REQUEST.value(), null));
        }
    }

    // Create / Process Payment
    @PostMapping("/pay")
    public ResponseEntity<ApiResponse<Payment>> pay(@RequestBody PaymentRequest request) {
        Payment payment = paymentService.processPayment(request);
        ApiResponse<Payment> response = new ApiResponse<>(
                "Payment processed successfully",
                HttpStatus.OK.value(),
                payment
        );
        return ResponseEntity.ok(response);
    }

    // Get all payments (supports both GET /api/payments and GET /api/payments/getPayments)
    // Admin: all payments. Others: only payments linked to the current user (as client, mechanic, or car wash).
    @GetMapping({"", "/"})
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsRoot(
            @RequestParam(required = false) String search,
            Authentication auth) {
        return getAllPayments(search, auth);
    }

    @GetMapping("/getPayments")
    public ResponseEntity<ApiResponse<List<Payment>>> getAllPayments(
            @RequestParam(required = false) String search,
            Authentication auth) {
        List<Payment> payments;
        if (isAdmin(auth)) {
            payments = paymentService.getAllPayments(search);
        } else {
            Optional<UserProfile> profileOpt = currentProfile(auth);
            if (profileOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse<>("Profile not found", HttpStatus.FORBIDDEN.value(), List.of()));
            }
            UserProfile profile = profileOpt.get();
            String username = profile.getUsername();
            String profileId = profile.getId();
            if (profile.getRoles().contains(Role.MECHANIC)) {
                payments = paymentService.getPaymentsByMechanic(profileId, search);
            } else if (profile.getRoles().contains(Role.CARWASH)) {
                payments = paymentService.getPaymentsByCarWash(profileId, search);
            } else {
                payments = paymentService.getPaymentsByClient(username, search);
            }
        }
        return ResponseEntity.ok(new ApiResponse<>(
                "Fetched payments",
                HttpStatus.OK.value(),
                payments));
    }

    // Get payments by client username (non-admin may only request their own username)
    @GetMapping("/client/{username}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByClient(
            @PathVariable String username,
            @RequestParam(required = false) String search,
            Authentication auth) {
        if (!isAdmin(auth) && (auth == null || !username.equals(auth.getName()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("You may only view your own payments", HttpStatus.FORBIDDEN.value(), null));
        }
        List<Payment> payments = paymentService.getPaymentsByClient(username, search);
        return ResponseEntity.ok(new ApiResponse<>(
                "Fetched payments for client: " + username,
                HttpStatus.OK.value(),
                payments));
    }

    // Get payments by mechanic ID (non-admin may only request their own profile id)
    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByMechanic(
            @PathVariable String mechanicId,
            @RequestParam(required = false) String search,
            Authentication auth) {
        if (!isAdmin(auth)) {
            Optional<UserProfile> profileOpt = currentProfile(auth);
            if (profileOpt.isEmpty() || !mechanicId.equals(profileOpt.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse<>("You may only view your own payments", HttpStatus.FORBIDDEN.value(), null));
            }
        }
        List<Payment> payments = paymentService.getPaymentsByMechanic(mechanicId, search);
        return ResponseEntity.ok(new ApiResponse<>(
                "Fetched payments for mechanic ID: " + mechanicId,
                HttpStatus.OK.value(),
                payments));
    }

    // Get payments by car wash ID (non-admin may only request their own profile id)
    @GetMapping("/carWash/{carWashId}")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByCarWash(
            @PathVariable String carWashId,
            @RequestParam(required = false) String search,
            Authentication auth) {
        if (!isAdmin(auth)) {
            Optional<UserProfile> profileOpt = currentProfile(auth);
            if (profileOpt.isEmpty() || !carWashId.equals(profileOpt.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse<>("You may only view your own payments", HttpStatus.FORBIDDEN.value(), null));
            }
        }
        List<Payment> payments = paymentService.getPaymentsByCarWash(carWashId, search);
        return ResponseEntity.ok(new ApiResponse<>(
                "Fetched payments for car wash ID: " + carWashId,
                HttpStatus.OK.value(),
                payments));
    }

    // Delete payment by ID
    @DeleteMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<Payment>> deletePaymentById(@PathVariable String paymentId) {
        Payment deletedPayment = paymentService.deletePaymentById(paymentId);
        ApiResponse<Payment> response = new ApiResponse<>(
                "Payment deleted successfully",
                HttpStatus.OK.value(),
                deletedPayment
        );
        return ResponseEntity.ok(response);
    }

    // Update payment status
    @PutMapping("/{paymentId}/status")
    public ResponseEntity<ApiResponse<Payment>> updatePaymentStatus(
            @PathVariable String paymentId,
            @RequestParam String status) {
        try {
            Payment payment = paymentService.updatePaymentStatus(paymentId, status);
            return ResponseEntity.ok(new ApiResponse<>(
                    "Payment status updated successfully",
                    HttpStatus.OK.value(),
                    payment));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(e.getMessage(), HttpStatus.NOT_FOUND.value(), null));
        }
    }

    // Delete all payments
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllPayments() {
        paymentService.deleteAllPayments();
        ApiResponse<Void> response = new ApiResponse<>(
                "All payments deleted successfully",
                HttpStatus.OK.value(),
                null
        );
        return ResponseEntity.ok(response);
    }
}
