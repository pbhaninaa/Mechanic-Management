package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByClientUsername(String clientUsername);
    List<Payment> findByMechanicId(String mechanicId);
    List<Payment> findByCarWashId(String carWashId);

    List<Payment> findByMechanicIdAndPaidAtBetweenOrderByPaidAtDesc(String mechanicId, LocalDateTime start, LocalDateTime end);
    List<Payment> findByCarWashIdAndPaidAtBetweenOrderByPaidAtDesc(String carWashId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM Payment p WHERE (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(p.jobDescription, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(p.clientUsername, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(p.status, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(p.jobId, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.paidAt DESC")
    List<Payment> findAllWithSearch(@Param("q") String q);

    @Query("SELECT p FROM Payment p WHERE p.mechanicId = :mechanicId AND (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(p.jobDescription, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(p.clientUsername, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(p.status, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.paidAt DESC")
    List<Payment> findByMechanicIdWithSearch(@Param("mechanicId") String mechanicId, @Param("q") String q);

    @Query("SELECT p FROM Payment p WHERE p.carWashId = :carWashId AND (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(p.jobDescription, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(p.clientUsername, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(p.status, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.paidAt DESC")
    List<Payment> findByCarWashIdWithSearch(@Param("carWashId") String carWashId, @Param("q") String q);

    @Query("SELECT p FROM Payment p WHERE p.clientUsername = :username AND (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(p.jobDescription, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(p.status, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.paidAt DESC")
    List<Payment> findByClientUsernameWithSearch(@Param("username") String username, @Param("q") String q);
}
