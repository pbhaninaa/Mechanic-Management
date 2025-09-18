package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.Payment;
import com.test.app.TestAppBackEnd.models.PaymentRequest; // optional if you have a Job entity
import com.test.app.TestAppBackEnd.repositories.MechanicRequestRepository;
import com.test.app.TestAppBackEnd.repositories.PaymentRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MechanicRequestRepository jobRepository; // optional
    private final UserProfileRepository userProfileRepository;
    private final double PLATFORM_FEE_PERCENT = 0.10; // 10% fee

    public PaymentService(PaymentRepository paymentRepository,UserProfileRepository userProfileRepository , MechanicRequestRepository jobRepository) {
        this.paymentRepository = paymentRepository;
        this.jobRepository = jobRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public Payment processPayment( PaymentRequest request) {
        if (request.getAmount() == null) {
            throw new IllegalArgumentException("Payment amount must be provided");
        }

        Long jobId = request.getJobId();
        if (jobId == null) {
            throw new IllegalArgumentException("Job ID must be provided");
        }

        // Fetch job and mechanic id (replace with your Job entity logic)
        var job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        double platformFee = request.getAmount() * PLATFORM_FEE_PERCENT;

        Payment payment = new Payment(
                request.getAmount(),
                request.getClientUsername(),
                jobId,
                request.getMechanicId(),
                request.getCarWashId(),
                platformFee
        );


        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsByClient(String clientUsername) {
        return paymentRepository.findByClientUsername(clientUsername);
    }

    public List<Payment> getPaymentsByMechanic(Long mechanicId) {
        return paymentRepository.findByMechanicId(mechanicId);
    }
}
