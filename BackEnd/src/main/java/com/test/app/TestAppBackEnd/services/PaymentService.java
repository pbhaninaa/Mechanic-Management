package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.Payment;
import com.test.app.TestAppBackEnd.models.PaymentRequest;
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import com.test.app.TestAppBackEnd.repositories.MechanicRequestRepository;
import com.test.app.TestAppBackEnd.repositories.PaymentRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Async;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MechanicRequestRepository mechanicRequestRepository;
    private final UserProfileRepository userProfileRepository;
    private final CarWashBookingRepository carWashBookingRepository;
    private final EmailService emailService;
    private final StripeService stripeService;
    private final double PLATFORM_FEE_PERCENT = 0.10; // 10% fee

    public PaymentService(
            PaymentRepository paymentRepository,
            UserProfileRepository userProfileRepository,
            MechanicRequestRepository mechanicRequestRepository,
            CarWashBookingRepository carWashBookingRepository,
            EmailService emailService,
            StripeService stripeService
    ) {
        this.paymentRepository = paymentRepository;
        this.mechanicRequestRepository = mechanicRequestRepository;
        this.userProfileRepository = userProfileRepository;
        this.carWashBookingRepository = carWashBookingRepository;
        this.emailService = emailService;
        this.stripeService = stripeService;
    }

    // ================= PROCESS PAYMENT =================
    @Transactional
    public Payment processPayment(PaymentRequest request) {
        if (request.getAmount() == null) {
            throw new IllegalArgumentException("Payment amount must be provided");
        }

        if (request.getPaymentIntentId() != null && !request.getPaymentIntentId().isBlank()) {
            if (!stripeService.verifyPaymentSucceeded(request.getPaymentIntentId())) {
                throw new IllegalArgumentException("Stripe payment not verified. Payment may have failed or already been processed.");
            }
        }

        String jobId = request.getJobId();
        if (jobId == null || jobId.isBlank()) {
            throw new IllegalArgumentException("Job ID must be provided");
        }

        double platformFee = request.getAmount() * PLATFORM_FEE_PERCENT;

        Payment payment = new Payment(
                request.getAmount() - platformFee,
                request.getClientUsername(),
                jobId,
                request.getMechanicId(),
                request.getCarWashId(),
                platformFee,
                (request.getMechanicId() != null && !request.getMechanicId().isBlank()) ? "Car Mechanical Service" : "Car Wash Service"
        );
        payment.setStatus("completed");

        Payment savedPayment = paymentRepository.save(payment);

        // Notify the service provider
        notifyServiceProvider(savedPayment);

        return savedPayment;
    }

    // ================= GETTERS =================
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsByClient(String clientUsername) {
        return paymentRepository.findByClientUsername(clientUsername);
    }

    public Payment getPaymentById(String id) {
        return paymentRepository.findById(id).orElse(null);
    }

    public List<Payment> getPaymentsByMechanic(String mechanicId) {
        return paymentRepository.findByMechanicId(mechanicId);
    }

    public List<Payment> getPaymentsByCarWash(String carWashId) {
        return paymentRepository.findByCarWashId(carWashId);
    }

    // ================= DELETE =================
    public Payment deletePaymentById(String paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));
        paymentRepository.delete(payment);
        return payment;
    }

    public void deleteAllPayments() {
        paymentRepository.deleteAll();
    }

    // ================= UPDATE STATUS =================
    public Payment updatePaymentStatus(String paymentId, String newStatus) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));
        payment.setStatus(newStatus);
        return paymentRepository.save(payment);
    }

    // ================= EMAIL NOTIFICATION =================
    @Async
    public void notifyServiceProvider(Payment payment) {
        try {
            String recipientEmail = null;
            String serviceType = null;

            // Determine recipient and service type dynamically
            if (payment.getMechanicId() != null) {
                recipientEmail = userProfileRepository.findById(payment.getMechanicId())
                        .map(profile -> profile.getEmail())
                        .orElse(null);

                // Fetch the mechanic request to get description/type
                serviceType = mechanicRequestRepository.findById(payment.getJobId())
                        .map(request -> "Mechanic Service: " + request.getDescription())
                        .orElse("Mechanic Service");
            } else if (payment.getCarWashId() != null) {
                recipientEmail = userProfileRepository.findById(payment.getCarWashId())
                        .map(profile -> profile.getEmail())
                        .orElse(null);

                // Fetch the car wash booking to get description/type
                serviceType = carWashBookingRepository.findById(payment.getJobId())
                        .map(booking -> {
                            StringBuilder sb = new StringBuilder("Car Wash: ");
                            if (booking.getServiceTypes() != null && !booking.getServiceTypes().isEmpty()) {
                                sb.append(String.join(", ", booking.getServiceTypes()));
                            }
                            if (booking.getCarDescription() != null && !booking.getCarDescription().isBlank()) {
                                sb.append(" - ").append(booking.getCarDescription());
                            }
                            return sb.length() > "Car Wash: ".length() ? sb.toString() : "Car Wash Service";
                        })
                        .orElse("Car Wash Service");
            }

            if (recipientEmail != null) {
                String subject = "New Payment Received";
                String body = "Hi,\n\n" +
                        "You have received a new payment for " + serviceType + ".\n\n" +
                        "Amount: R" + payment.getAmount() + "\n" +
                        "Client: " + payment.getClientUsername() + "\n\nThank you!";

                emailService.sendEmail(recipientEmail, "no-reply@testapp.com", subject, body);
            }

        } catch (Exception e) {
            System.out.println("Failed to send payment notification: " + e.getMessage());
        }
    }

}
