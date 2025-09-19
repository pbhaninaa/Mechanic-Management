package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.Payment;
import com.test.app.TestAppBackEnd.models.PaymentRequest; // optional if you have a Job entity
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import com.test.app.TestAppBackEnd.repositories.MechanicRequestRepository;
import com.test.app.TestAppBackEnd.repositories.PaymentRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MechanicRequestRepository mechanicRequestRepository; // optional
    private final UserProfileRepository userProfileRepository;
    private final CarWashBookingRepository carWashBookingRepository;
    private final double PLATFORM_FEE_PERCENT = 0.10; // 10% fee

    public PaymentService(PaymentRepository paymentRepository, UserProfileRepository userProfileRepository , MechanicRequestRepository mechanicRequestRepository, CarWashBookingRepository carWashBookingRepository) {
        this.paymentRepository = paymentRepository;
        this.mechanicRequestRepository = mechanicRequestRepository;
        this.userProfileRepository = userProfileRepository;
        this.carWashBookingRepository = carWashBookingRepository;
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

//        Object job = null; // can hold either type
//
//        if (request.getMechanicId() != null) {
//            job = mechanicRequestRepository.findById(jobId)
//                    .orElseThrow(() -> new IllegalArgumentException("Mechanic job not found with ID: " + jobId));
//        } else if (request.getCarWashId() != null) {
//            job = carWashBookingRepository.findById(jobId)
//                    .orElseThrow(() -> new IllegalArgumentException("Car Wash booking not found with ID: " + jobId));
//        } else {
//            throw new IllegalArgumentException("Either mechanicId or carWashId must be provided");
//        }



        double platformFee = request.getAmount() * PLATFORM_FEE_PERCENT;

        Payment payment = new Payment(
                request.getAmount()-platformFee,
                request.getClientUsername(),
                jobId,
                request.getMechanicId(),
                request.getCarWashId(),
                platformFee,
                request.getMechanicId() != null?"Car Mechanical Service":"Car Wash service"
        );


        return paymentRepository.save(payment);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public List<Payment> getPaymentsByClient(String clientUsername) {
        return paymentRepository.findByClientUsername(clientUsername);
    }
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id).orElse(null);
    }

    public List<Payment> getPaymentsByMechanic(Long mechanicId) {
        return paymentRepository.findByMechanicId(mechanicId);
    } public List<Payment> getPaymentsByCarWash(Long id) {
        return paymentRepository.findByCarWashId(id);
    }
    public Payment deletePaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));
        paymentRepository.delete(payment);
        return payment;
    }

    public void deleteAllPayments() {
        paymentRepository.deleteAll();
    }

}
