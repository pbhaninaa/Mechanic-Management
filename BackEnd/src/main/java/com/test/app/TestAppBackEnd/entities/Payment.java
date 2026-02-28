package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Payment {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // ================== PAYMENT DETAILS ==================
    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Double platformFee;

    @Column(nullable = false)
    private LocalDateTime paidAt;

    @Column(nullable = false)
    private String status = "pending"; // pending, completed, failed, refunded

    // ================== CLIENT INFO ==================
    @Column(nullable = false, name = "client_username")
    private String clientUsername;

    // ================== JOB INFO ==================
    @Column(name = "job_id")
    private String jobId;

    @Column(name = "job_description")
    private String jobDescription;

    @Column(name = "mechanic_id")
    private String mechanicId;

    @Column(name = "car_wash_id")
    private String carWashId;

    public Payment(double v, String clientUsername, String jobId, String mechanicId, String carWashId, double platformFee, String s) {
        this.amount = v;
        this.clientUsername = clientUsername;
        this.jobId = jobId;
        this.mechanicId = mechanicId;
        this.carWashId = carWashId;
        this.platformFee = platformFee;
        this.status = s;
    }

    // ================== AUTO FIELDS ==================
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (paidAt == null) {
            paidAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "pending";
        }
    }
}