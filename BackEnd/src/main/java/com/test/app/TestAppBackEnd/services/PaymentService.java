package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.Payment;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.models.PaymentRequest;
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import com.test.app.TestAppBackEnd.repositories.MechanicRequestRepository;
import com.test.app.TestAppBackEnd.repositories.PaymentRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Async;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MechanicRequestRepository mechanicRequestRepository;
    private final UserProfileRepository userProfileRepository;
    private final CarWashBookingRepository carWashBookingRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final StripeService stripeService;
    private final double PLATFORM_FEE_PERCENT = 0.10; // 10% fee

    public PaymentService(
            PaymentRepository paymentRepository,
            UserProfileRepository userProfileRepository,
            MechanicRequestRepository mechanicRequestRepository,
            CarWashBookingRepository carWashBookingRepository,
            EmailService emailService,
            SmsService smsService,
            StripeService stripeService
    ) {
        this.paymentRepository = paymentRepository;
        this.mechanicRequestRepository = mechanicRequestRepository;
        this.userProfileRepository = userProfileRepository;
        this.carWashBookingRepository = carWashBookingRepository;
        this.emailService = emailService;
        this.smsService = smsService;
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

    private static final int DEFAULT_PAGE_SIZE = 50;

    // ================= GETTERS =================
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll(PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
    }

    public List<Payment> getAllPayments(String search) {
        if (search != null && !search.isBlank()) {
            return paymentRepository.findAllWithSearch(search.trim(), PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
        }
        return paymentRepository.findAll(PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
    }

    public List<Payment> getPaymentsByClient(String clientUsername) {
        return paymentRepository.findByClientUsername(clientUsername);
    }

    public List<Payment> getPaymentsByClient(String clientUsername, String search) {
        if (search != null && !search.isBlank()) {
            return paymentRepository.findByClientUsernameWithSearch(clientUsername, search.trim());
        }
        return paymentRepository.findByClientUsername(clientUsername);
    }

    public List<Payment> getPaymentsByMechanic(String mechanicId) {
        return paymentRepository.findByMechanicId(mechanicId);
    }

    public List<Payment> getPaymentsByMechanic(String mechanicId, String search) {
        if (search != null && !search.isBlank()) {
            return paymentRepository.findByMechanicIdWithSearch(mechanicId, search.trim());
        }
        return paymentRepository.findByMechanicId(mechanicId);
    }

    public List<Payment> getPaymentsByCarWash(String carWashId) {
        return paymentRepository.findByCarWashId(carWashId);
    }

    public List<Payment> getPaymentsByCarWash(String carWashId, String search) {
        if (search != null && !search.isBlank()) {
            return paymentRepository.findByCarWashIdWithSearch(carWashId, search.trim());
        }
        return paymentRepository.findByCarWashId(carWashId);
    }

    public Payment getPaymentById(String id) {
        return paymentRepository.findById(id).orElse(null);
    }

    /** Earnings (payments) for a mechanic within date range (paidAt). */
    public List<Payment> getPaymentsByMechanicAndDateRange(String mechanicId, String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        LocalDateTime startTime = start.atStartOfDay();
        LocalDateTime endTime = end.atTime(LocalTime.MAX);
        return paymentRepository.findByMechanicIdAndPaidAtBetweenOrderByPaidAtDesc(mechanicId, startTime, endTime);
    }

    /** Earnings (payments) for a car wash within date range (paidAt). */
    public List<Payment> getPaymentsByCarWashAndDateRange(String carWashId, String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        LocalDateTime startTime = start.atStartOfDay();
        LocalDateTime endTime = end.atTime(LocalTime.MAX);
        return paymentRepository.findByCarWashIdAndPaidAtBetweenOrderByPaidAtDesc(carWashId, startTime, endTime);
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
            UserProfile profile = null;
            String serviceType = null;

            if (payment.getMechanicId() != null) {
                profile = userProfileRepository.findById(payment.getMechanicId()).orElse(null);
                serviceType = mechanicRequestRepository.findById(payment.getJobId())
                        .map(r -> "Mechanic Service: " + r.getDescription())
                        .orElse("Mechanic Service");
            } else if (payment.getCarWashId() != null) {
                profile = userProfileRepository.findById(payment.getCarWashId()).orElse(null);
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

            if (profile == null) return;

            String msg = "You have received a new payment for " + serviceType + ". Amount: R" + payment.getAmount() + ", Client: " + payment.getClientUsername();

            if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
                emailService.sendEmail(profile.getEmail(), "no-reply@testapp.com", "New Payment Received", "Hi,\n\n" + msg + "\n\nThank you!");
            }
            if (profile.getPhoneNumber() != null && !profile.getPhoneNumber().isBlank()) {
                smsService.sendSms(profile.getPhoneNumber(), profile.getCountryCode(), "MechConnect: " + msg);
            }

        } catch (Exception e) {
            System.out.println("Failed to send payment notification: " + e.getMessage());
        }
    }

}
