package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
public class Payment {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    private Double amount;
    private String clientUsername;
    private String jobId;
    private String mechanicId;
    private String carWashId;
    private Double platformFee;
    private LocalDateTime paidAt;
    private String jobDescription;
    private String status = "pending"; // pending, completed, failed, refunded

    // Constructors
    public Payment() {}

    public Payment(Double amount, String clientUsername, String jobId, String mechanicId, String carWashId, Double platformFee, String jobDescription) {
        this.amount = amount;
        this.clientUsername = clientUsername;
        this.jobId = jobId;
        this.mechanicId = mechanicId;
        this.carWashId = carWashId; // <--- Set
        this.platformFee = platformFee;
        this.paidAt = LocalDateTime.now();
        this.jobDescription = jobDescription;
    }

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }

    public String getMechanicId() { return mechanicId; }
    public void setMechanicId(String mechanicId) { this.mechanicId = mechanicId; }

    public String getCarWashId() { return carWashId; }
    public void setCarWashId(String carWashId) { this.carWashId = carWashId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public Double getPlatformFee() { return platformFee; }
    public void setPlatformFee(Double platformFee) { this.platformFee = platformFee; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
